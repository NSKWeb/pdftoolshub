import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: { status: 'ok' | 'error'; responseTime: number; message?: string };
    memory: { status: 'ok' | 'warning' | 'error'; usage: number; message?: string };
  };
}

export async function GET() {
  const checks: HealthCheck['checks'] = {
    database: { status: 'ok', responseTime: 0 },
    memory: { status: 'ok', usage: 0 }
  };

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    checks.database.status = 'error';
    checks.database.message = error instanceof Error ? error.message : 'Database connection failed';
    logger.error({ error }, 'Health check: Database error');
  }

  const memUsage = process.memoryUsage();
  checks.memory.usage = Math.round(memUsage.heapUsed / 1024 / 1024);
  if (checks.memory.usage > 1024) {
    checks.memory.status = 'error';
    checks.memory.message = 'High memory usage detected';
  } else if (checks.memory.usage > 512) {
    checks.memory.status = 'warning';
  }

  const hasError = Object.values(checks).some(c => c.status === 'error');
  const hasWarning = Object.values(checks).some(c => c.status === 'warning');
  const status = hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';

  const response: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '5.0.0',
    checks
  };

  return NextResponse.json(response, {
    status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}
