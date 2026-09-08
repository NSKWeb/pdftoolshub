import { logger } from './logger';
import { randomUUID } from 'crypto';

interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
  userAgent?: string;
  ip?: string;
}

const activeRequests = new Map<string, RequestMetrics>();

export function startRequestTracking(method: string, path: string, userAgent?: string, ip?: string): string {
  const requestId = randomUUID();
  activeRequests.set(requestId, {
    requestId,
    method,
    path,
    startTime: Date.now(),
    userAgent,
    ip
  });
  return requestId;
}

export function endRequestTracking(requestId: string, statusCode: number, error?: Error): void {
  const metrics = activeRequests.get(requestId);
  if (!metrics) return;

  const duration = Date.now() - metrics.startTime;
  activeRequests.delete(requestId);

  logger.info({
    requestId,
    method: metrics.method,
    path: metrics.path,
    duration,
    statusCode,
    error: error?.message
  }, 'Request completed');
}

export function getActiveRequestCount(): number {
  return activeRequests.size;
}

export function getAverageResponseTime(windowMs: number = 60000): number {
  const now = Date.now();
  let total = 0;
  let count = 0;
  
  activeRequests.forEach(m => {
    if (now - m.startTime < windowMs) {
      total += now - m.startTime;
      count++;
    }
  });
  
  return count > 0 ? total / count : 0;
}
