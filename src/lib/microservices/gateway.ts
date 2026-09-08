import { prisma } from '@/lib/prisma';
import CircuitBreaker from 'opossum';

export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceId: string;
  targetEndpoint: string;
  rateLimit?: number;
  burstLimit?: number;
  authRequired?: boolean;
  cachingEnabled?: boolean;
  cacheTtl?: number;
  circuitBreaker?: {
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
  };
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export async function createRoute(config: RouteConfig) {
  const route = await prisma.aPIGatewayRoutes.create({
    data: {
      path: config.path,
      method: config.method,
      serviceId: config.serviceId,
      targetEndpoint: config.targetEndpoint,
      rateLimit: config.rateLimit ?? 1000,
      burstLimit: config.burstLimit ?? 2000,
      authRequired: config.authRequired ?? true,
      cachingEnabled: config.cachingEnabled ?? false,
      cacheTtl: config.cacheTtl ?? 300,
      circuitBreaker: config.circuitBreaker ?? {
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 10
      },
      isActive: true
    }
  });
  
  // Initialize circuit breaker
  initializeCircuitBreaker(route.id, config.targetEndpoint, config.circuitBreaker);
  
  return route;
}

function initializeCircuitBreaker(
  routeId: string,
  endpoint: string,
  options?: RouteConfig['circuitBreaker']
) {
  const breaker = new CircuitBreaker(
    async (request: unknown) => {
      // In production, would make actual HTTP request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return response.json();
    },
    {
      errorThresholdPercentage: options?.errorThresholdPercentage ?? 50,
      resetTimeout: options?.resetTimeout ?? 30000,
      volumeThreshold: options?.volumeThreshold ?? 10
    }
  );
  
  breaker.on('open', () => {
    console.log(`Circuit breaker opened for route ${routeId}`);
  });
  
  breaker.on('halfOpen', () => {
    console.log(`Circuit breaker half-open for route ${routeId}`);
  });
  
  breaker.on('close', () => {
    console.log(`Circuit breaker closed for route ${routeId}`);
  });
  
  circuitBreakers.set(routeId, breaker);
}

export async function getRoute(path: string, method: string) {
  return await prisma.aPIGatewayRoutes.findFirst({
    where: {
      path,
      method: method.toUpperCase(),
      isActive: true
    }
  });
}

export async function getAllActiveRoutes() {
  return await prisma.aPIGatewayRoutes.findMany({
    where: { isActive: true },
    orderBy: { path: 'asc' }
  });
}

export async function logGatewayRequest(logData: {
  routeId: string;
  requestId: string;
  clientIp?: string;
  userId?: string;
  requestMethod: string;
  requestPath: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseStatus: number;
  responseTime: number;
  responseHeaders?: Record<string, string>;
  errorMessage?: string;
}) {
  return await prisma.aPIGatewayLogs.create({
    data: {
      routeId: logData.routeId,
      requestId: logData.requestId,
      clientIp: logData.clientIp,
      userId: logData.userId,
      requestMethod: logData.requestMethod,
      requestPath: logData.requestPath,
      requestHeaders: logData.requestHeaders ?? {},
      requestBody: logData.requestBody ?? {},
      responseStatus: logData.responseStatus,
      responseTime: logData.responseTime,
      responseHeaders: logData.responseHeaders ?? {},
      errorMessage: logData.errorMessage
    }
  });
}

export async function getRouteMetrics(routeId: string, timeRange: '1h' | '24h' | '7d') {
  const hours = { '1h': 1, '24h': 24, '7d': 168 };
  const since = new Date(Date.now() - hours[timeRange] * 60 * 60 * 1000);
  
  const logs = await prisma.aPIGatewayLogs.findMany({
    where: {
      routeId,
      createdAt: { gte: since }
    }
  });
  
  const totalRequests = logs.length;
  const successfulRequests = logs.filter(l => l.responseStatus < 400).length;
  const failedRequests = totalRequests - successfulRequests;
  const avgResponseTime = logs.length > 0
    ? logs.reduce((sum, l) => sum + l.responseTime, 0) / logs.length
    : 0;
  
  // Response time percentiles
  const sortedTimes = logs.map(l => l.responseTime).sort((a, b) => a - b);
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] ?? 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] ?? 0;
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avgResponseTime: Math.round(avgResponseTime),
    p95ResponseTime: p95,
    p99ResponseTime: p99
  };
}

export async function getCircuitBreakerStatus(routeId: string) {
  const breaker = circuitBreakers.get(routeId);
  
  if (!breaker) {
    return { status: 'unknown', stats: {} };
  }
  
  return {
    status: breaker.opened ? 'open' : breaker.halfOpen ? 'halfOpen' : 'closed',
    stats: {
      failures: breaker.stats.failures,
      successes: breaker.stats.successes,
      rejects: breaker.stats.rejects,
      timeouts: breaker.stats.timeouts,
      cacheHits: breaker.stats.cacheHits
    }
  };
}

export async function updateRouteStatus(routeId: string, isActive: boolean) {
  return await prisma.aPIGatewayRoutes.update({
    where: { id: routeId },
    data: { isActive, updatedAt: new Date() }
  });
}

export async function deleteRoute(routeId: string) {
  // Remove circuit breaker
  circuitBreakers.delete(routeId);
  
  return await prisma.aPIGatewayRoutes.delete({
    where: { id: routeId }
  });
}

// Rate limiting helper
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
}
