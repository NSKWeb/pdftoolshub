import { prisma } from '@/lib/prisma';

export interface RegionConfig {
  regionCode: string;
  regionName: string;
  provider: 'aws' | 'azure' | 'gcp';
  endpoint?: string;
  failoverRegionId?: string;
}

export interface PerformanceMetrics {
  latency: number;
  availability: number;
  throughput: number;
  errorRate: number;
}

export async function createRegion(config: RegionConfig) {
  return await prisma.globalRegions.create({
    data: {
      regionCode: config.regionCode,
      regionName: config.regionName,
      provider: config.provider,
      endpoint: config.endpoint,
      failoverRegionId: config.failoverRegionId,
      status: 'active',
      performanceMetrics: {}
    }
  });
}

export async function getAllActiveRegions() {
  return await prisma.globalRegions.findMany({
    where: { status: 'active' },
    orderBy: { regionName: 'asc' }
  });
}

export async function getRegionByCode(regionCode: string) {
  return await prisma.globalRegions.findUnique({
    where: { regionCode }
  });
}

export async function updateRegionMetrics(
  regionId: string,
  metrics: PerformanceMetrics
) {
  return await prisma.globalRegions.update({
    where: { id: regionId },
    data: {
      performanceMetrics: metrics,
      updatedAt: new Date()
    }
  });
}

export async function getNearestRegion(userLatitude: number, userLongitude: number) {
  const regions = await getAllActiveRegions();
  
  // Simple distance calculation - in production would use proper geolocation
  const regionCoordinates: Record<string, { lat: number; lng: number }> = {
    'us-east-1': { lat: 39.0, lng: -77.0 },
    'us-west-2': { lat: 45.5, lng: -122.0 },
    'eu-west-1': { lat: 53.0, lng: -8.0 },
    'eu-central-1': { lat: 50.0, lng: 8.0 },
    'ap-southeast-1': { lat: 1.3, lng: 103.8 },
    'ap-northeast-1': { lat: 35.6, lng: 139.6 }
  };

  let nearestRegion = regions[0];
  let minDistance = Infinity;

  for (const region of regions) {
    const coords = regionCoordinates[region.regionCode];
    if (coords) {
      const distance = Math.sqrt(
        Math.pow(coords.lat - userLatitude, 2) +
        Math.pow(coords.lng - userLongitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = region;
      }
    }
  }

  return nearestRegion;
}

export async function getFailoverRegion(regionId: string) {
  const region = await prisma.globalRegions.findUnique({
    where: { id: regionId }
  });
  
  if (region?.failoverRegionId) {
    return await prisma.globalRegions.findUnique({
      where: { id: region.failoverRegionId }
    });
  }
  
  return null;
}

export async function updateRegionStatus(
  regionId: string,
  status: 'active' | 'degraded' | 'maintenance' | 'offline'
) {
  return await prisma.globalRegions.update({
    where: { id: regionId },
    data: { status, updatedAt: new Date() }
  });
}

export async function getRegionHealthSummary() {
  const regions = await prisma.globalRegions.findMany();
  
  return regions.map(region => ({
    id: region.id,
    regionCode: region.regionCode,
    regionName: region.regionName,
    provider: region.provider,
    status: region.status,
    metrics: region.performanceMetrics as PerformanceMetrics || {}
  }));
}
