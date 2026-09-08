import { prisma } from '@/lib/prisma';

export interface HealthScoreFactors {
  usage: {
    loginFrequency: number;
    featureAdoption: number;
    apiUsage: number;
  };
  engagement: {
    supportTickets: number;
    feedbackScore: number;
    npsScore: number;
  };
  payment: {
    onTimePayments: boolean;
    paymentFailures: number;
    planUpgrades: number;
  };
}

export async function calculateHealthScore(tenantId: string): Promise<{
  overallScore: number;
  usageScore: number;
  engagementScore: number;
  supportScore: number;
  paymentScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}> {
  // Get usage data
  const usageScore = await calculateUsageScore(tenantId);
  
  // Get engagement data
  const engagementScore = await calculateEngagementScore(tenantId);
  
  // Get support data
  const supportScore = await calculateSupportScore(tenantId);
  
  // Get payment data
  const paymentScore = await calculatePaymentScore(tenantId);
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    usageScore * 0.30 +
    engagementScore * 0.25 +
    supportScore * 0.25 +
    paymentScore * 0.20
  );
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overallScore >= 80) {
    riskLevel = 'low';
  } else if (overallScore >= 60) {
    riskLevel = 'medium';
  } else if (overallScore >= 40) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  // Save or update health score
  await prisma.customerHealthScores.upsert({
    where: { tenantId },
    create: {
      tenantId,
      overallScore,
      usageScore,
      engagementScore,
      supportScore,
      paymentScore,
      riskLevel,
      factors: {
        usage: usageScore,
        engagement: engagementScore,
        support: supportScore,
        payment: paymentScore
      }
    },
    update: {
      overallScore,
      usageScore,
      engagementScore,
      supportScore,
      paymentScore,
      riskLevel,
      factors: {
        usage: usageScore,
        engagement: engagementScore,
        support: supportScore,
        payment: paymentScore
      },
      lastCalculatedAt: new Date()
    }
  });
  
  return {
    overallScore,
    usageScore,
    engagementScore,
    supportScore,
    paymentScore,
    riskLevel
  };
}

async function calculateUsageScore(tenantId: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Get tenant users
  const users = await prisma.users.count({
    where: { tenantId }
  });
  
  // Get recent usage
  const recentUsage = await prisma.usageLogs.count({
    where: {
      tenantId,
      timestamp: { gte: thirtyDaysAgo }
    }
  });
  
  // Get active workflows
  const activeWorkflows = await prisma.workflows.count({
    where: {
      tenantId,
      isActive: true
    }
  });
  
  // Calculate score based on activity
  const usagePerUser = users > 0 ? recentUsage / users : 0;
  
  if (usagePerUser >= 50 && activeWorkflows >= 3) return 100;
  if (usagePerUser >= 30 && activeWorkflows >= 2) return 80;
  if (usagePerUser >= 10 && activeWorkflows >= 1) return 60;
  if (usagePerUser >= 5) return 40;
  return 20;
}

async function calculateEngagementScore(tenantId: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Count support tickets (fewer is better for engagement score)
  const supportTickets = await prisma.supportTickets.count({
    where: {
      tenantId,
      createdAt: { gte: thirtyDaysAgo }
    }
  });
  
  // Get active users
  const activeUsers = await prisma.users.count({
    where: {
      tenantId,
      lastResetDate: { gte: thirtyDaysAgo }
    }
  });
  
  const totalUsers = await prisma.users.count({ where: { tenantId } });
  
  // Calculate engagement rate
  const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  
  // Fewer tickets can indicate good engagement (not frustrated)
  // But zero tickets might mean no usage
  if (engagementRate >= 80 && supportTickets >= 1 && supportTickets <= 10) return 100;
  if (engagementRate >= 60 && supportTickets <= 20) return 80;
  if (engagementRate >= 40) return 60;
  if (engagementRate >= 20) return 40;
  return 20;
}

async function calculateSupportScore(tenantId: string): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Get support tickets
  const tickets = await prisma.supportTickets.findMany({
    where: {
      tenantId,
      createdAt: { gte: thirtyDaysAgo }
    }
  });
  
  if (tickets.length === 0) {
    return 80; // No issues
  }
  
  // Calculate resolution metrics
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  const resolutionRate = (resolvedTickets.length / tickets.length) * 100;
  
  // Calculate average resolution time
  const avgResolutionTime = resolvedTickets.reduce((sum, t) => {
    if (t.resolvedAt && t.createdAt) {
      return sum + (t.resolvedAt.getTime() - t.createdAt.getTime());
    }
    return sum;
  }, 0) / (resolvedTickets.length || 1);
  
  const avgHours = avgResolutionTime / (1000 * 60 * 60);
  
  // Score based on resolution rate and speed
  if (resolutionRate >= 95 && avgHours <= 24) return 100;
  if (resolutionRate >= 85 && avgHours <= 48) return 80;
  if (resolutionRate >= 70 && avgHours <= 72) return 60;
  if (resolutionRate >= 50) return 40;
  return 20;
}

async function calculatePaymentScore(tenantId: string): Promise<number> {
  // Get subscription status
  const subscription = await prisma.subscriptions.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!subscription) {
    return 50; // Unknown
  }
  
  // Check payment history
  const invoices = await prisma.invoices.findMany({
    where: {
      subscriptionId: subscription.id
    },
    orderBy: { createdAt: 'desc' },
    take: 12
  });
  
  if (invoices.length === 0) {
    return 70; // No payment history yet
  }
  
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const paymentRate = (paidInvoices.length / invoices.length) * 100;
  
  // Check for recent payment failures
  const recentFailures = invoices.filter(
    i => i.status === 'failed' && i.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  
  if (paymentRate >= 95 && recentFailures === 0) return 100;
  if (paymentRate >= 85 && recentFailures <= 1) return 80;
  if (paymentRate >= 70) return 60;
  if (paymentRate >= 50) return 40;
  return 20;
}

export async function getAtRiskCustomers() {
  return await prisma.customerHealthScores.findMany({
    where: {
      riskLevel: { in: ['high', 'critical'] }
    },
    include: {
      tenant: {
        select: {
          name: true,
          domain: true,
          planType: true
        }
      }
    },
    orderBy: { overallScore: 'asc' }
  });
}

export async function getHealthScoreDistribution() {
  const scores = await prisma.customerHealthScores.groupBy({
    by: ['riskLevel'],
    _count: { id: true }
  });
  
  return scores.map(s => ({
    riskLevel: s.riskLevel,
    count: s._count.id
  }));
}
