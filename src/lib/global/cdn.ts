import { prisma } from '@/lib/prisma';

export interface CDNNode {
  regionId: string;
  nodeLocation: string;
  ipAddress?: string;
}

export interface NodeMetrics {
  cacheHitRate: number;
  requestCount: number;
  bandwidthUsed: bigint;
}

export async function createEdgeNode(node: CDNNode) {
  return await prisma.cDNEdgeNodes.create({
    data: {
      regionId: node.regionId,
      nodeLocation: node.nodeLocation,
      ipAddress: node.ipAddress,
      status: 'active',
      cacheHitRate: 0,
      requestCount: 0,
      bandwidthUsed: BigInt(0)
    }
  });
}

export async function getActiveEdgeNodes(regionId?: string) {
  const where: { status: string; regionId?: string } = { status: 'active' };
  if (regionId) {
    where.regionId = regionId;
  }
  
  return await prisma.cDNEdgeNodes.findMany({
    where,
    orderBy: { requestCount: 'desc' }
  });
}

export async function updateNodeMetrics(
  nodeId: string,
  metrics: NodeMetrics
) {
  return await prisma.cDNEdgeNodes.update({
    where: { id: nodeId },
    data: {
      cacheHitRate: metrics.cacheHitRate,
      requestCount: metrics.requestCount,
      bandwidthUsed: metrics.bandwidthUsed,
      lastActiveAt: new Date()
    }
  });
}

export async function incrementNodeStats(
  nodeId: string,
  bandwidthBytes: number
) {
  const node = await prisma.cDNEdgeNodes.findUnique({
    where: { id: nodeId }
  });
  
  if (node) {
    await prisma.cDNEdgeNodes.update({
      where: { id: nodeId },
      data: {
        requestCount: { increment: 1 },
        bandwidthUsed: { increment: BigInt(bandwidthBytes) },
        lastActiveAt: new Date()
      }
    });
  }
}

export async function getCDNStats() {
  const nodes = await prisma.cDNEdgeNodes.findMany();
  
  const totalRequests = nodes.reduce((sum, node) => sum + node.requestCount, 0);
  const totalBandwidth = nodes.reduce(
    (sum, node) => sum + Number(node.bandwidthUsed),
    0
  );
  const avgCacheHitRate = nodes.length > 0
    ? nodes.reduce((sum, node) => sum + (node.cacheHitRate || 0), 0) / nodes.length
    : 0;

  return {
    totalNodes: nodes.length,
    activeNodes: nodes.filter(n => n.status === 'active').length,
    totalRequests,
    totalBandwidth,
    avgCacheHitRate: Math.round(avgCacheHitRate * 100) / 100
  };
}

export async function getOptimalEdgeNode(userIp: string, regionId?: string) {
  // In production, would use GeoIP lookup and latency-based routing
  const nodes = await getActiveEdgeNodes(regionId);
  
  if (nodes.length === 0) {
    return null;
  }
  
  // Select node with best cache hit rate and lowest load
  return nodes.sort((a, b) => {
    const scoreA = (a.cacheHitRate || 0) * 1000 - a.requestCount;
    const scoreB = (b.cacheHitRate || 0) * 1000 - b.requestCount;
    return scoreB - scoreA;
  })[0];
}
