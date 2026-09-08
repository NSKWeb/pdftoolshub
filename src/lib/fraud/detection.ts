import { prisma } from '@/lib/prisma';

export interface FraudCheckInput {
  userId?: string;
  tenantId?: string;
  actionType: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface RiskFactors {
  velocityRisk: number;
  geolocationRisk: number;
  deviceRisk: number;
  behaviorRisk: number;
  patternRisk: number;
}

export async function calculateRiskScore(input: FraudCheckInput): Promise<{
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactors;
  actionTaken: string;
}> {
  const riskFactors: RiskFactors = {
    velocityRisk: await calculateVelocityRisk(input),
    geolocationRisk: await calculateGeolocationRisk(input),
    deviceRisk: await calculateDeviceRisk(input),
    behaviorRisk: await calculateBehaviorRisk(input),
    patternRisk: await calculatePatternRisk(input)
  };
  
  // Weighted risk score calculation
  const riskScore = (
    riskFactors.velocityRisk * 0.25 +
    riskFactors.geolocationRisk * 0.20 +
    riskFactors.deviceRisk * 0.20 +
    riskFactors.behaviorRisk * 0.20 +
    riskFactors.patternRisk * 0.15
  );
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let actionTaken: string;
  
  if (riskScore >= 0.9) {
    riskLevel = 'critical';
    actionTaken = 'blocked';
  } else if (riskScore >= 0.7) {
    riskLevel = 'high';
    actionTaken = 'challenge';
  } else if (riskScore >= 0.4) {
    riskLevel = 'medium';
    actionTaken = 'monitored';
  } else {
    riskLevel = 'low';
    actionTaken = 'allowed';
  }
  
  // Log fraud detection
  await prisma.fraudDetectionLogs.create({
    data: {
      userId: input.userId,
      tenantId: input.tenantId,
      actionType: input.actionType,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      riskScore,
      detectionModel: 'ml-v2',
      riskFactors,
      actionTaken,
      isConfirmedFraud: false,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent
    }
  });
  
  return { riskScore, riskLevel, riskFactors, actionTaken };
}

async function calculateVelocityRisk(input: FraudCheckInput): Promise<number> {
  if (!input.userId) return 0.5;
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const recentActions = await prisma.fraudDetectionLogs.count({
    where: {
      userId: input.userId,
      createdAt: { gte: oneHourAgo }
    }
  });
  
  // Risk increases with more actions per hour
  if (recentActions > 100) return 1.0;
  if (recentActions > 50) return 0.8;
  if (recentActions > 20) return 0.6;
  if (recentActions > 10) return 0.4;
  return 0.1;
}

async function calculateGeolocationRisk(input: FraudCheckInput): Promise<number> {
  if (!input.userId || !input.ipAddress) return 0.3;
  
  // In production, would check for:
  // - Sudden location changes (impossible travel)
  // - Known VPN/proxy IPs
  // - High-risk countries
  // - IP reputation
  
  return 0.2; // Placeholder
}

async function calculateDeviceRisk(input: FraudCheckInput): Promise<number> {
  if (!input.userId) return 0.3;
  
  // In production, would check:
  // - New device fingerprint
  // - Known malicious device signatures
  // - Device reputation
  
  return 0.2; // Placeholder
}

async function calculateBehaviorRisk(input: FraudCheckInput): Promise<number> {
  if (!input.userId) return 0.3;
  
  const profile = await prisma.behavioralProfiles.findUnique({
    where: { userId: input.userId }
  });
  
  if (!profile) return 0.5;
  
  return profile.anomalyScore || 0.2;
}

async function calculatePatternRisk(input: FraudCheckInput): Promise<number> {
  if (!input.userId) return 0.3;
  
  // Check for known fraud patterns
  const recentFlags = await prisma.fraudDetectionLogs.count({
    where: {
      userId: input.userId,
      riskScore: { gte: 0.7 },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });
  
  if (recentFlags > 5) return 0.9;
  if (recentFlags > 2) return 0.7;
  if (recentFlags > 0) return 0.4;
  return 0.1;
}

export async function updateBehavioralProfile(
  userId: string,
  eventData: Record<string, unknown>
) {
  const profile = await prisma.behavioralProfiles.findUnique({
    where: { userId }
  });
  
  if (profile) {
    // Update existing profile
    const currentData = profile.profileData as Record<string, unknown>;
    
    return await prisma.behavioralProfiles.update({
      where: { userId },
      data: {
        profileData: { ...currentData, ...eventData },
        lastUpdatedAt: new Date()
      }
    });
  } else {
    // Create new profile
    return await prisma.behavioralProfiles.create({
      data: {
        userId,
        profileData: eventData,
        riskLevel: 'low',
        anomalyScore: 0
      }
    });
  }
}

export async function createSecurityIncident(
  tenantId: string | undefined,
  incidentType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  affectedResources?: string[],
  indicators?: Record<string, unknown>
) {
  return await prisma.securityIncidents.create({
    data: {
      tenantId,
      incidentType,
      severity,
      description,
      affectedResources: affectedResources ?? [],
      indicators: indicators ?? {},
      status: 'detected',
      detectedAt: new Date()
    }
  });
}

export async function getFraudStats(timeRange: '1h' | '24h' | '7d' | '30d') {
  const timeRanges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const since = new Date(Date.now() - timeRanges[timeRange]);
  
  const [
    totalChecks,
    highRiskEvents,
    blockedEvents,
    confirmedFraud
  ] = await Promise.all([
    prisma.fraudDetectionLogs.count({
      where: { createdAt: { gte: since } }
    }),
    prisma.fraudDetectionLogs.count({
      where: {
        createdAt: { gte: since },
        riskScore: { gte: 0.7 }
      }
    }),
    prisma.fraudDetectionLogs.count({
      where: {
        createdAt: { gte: since },
        actionTaken: 'blocked'
      }
    }),
    prisma.fraudDetectionLogs.count({
      where: {
        createdAt: { gte: since },
        isConfirmedFraud: true
      }
    })
  ]);
  
  return {
    totalChecks,
    highRiskEvents,
    blockedEvents,
    confirmedFraud,
    blockRate: totalChecks > 0 ? (blockedEvents / totalChecks) * 100 : 0
  };
}
