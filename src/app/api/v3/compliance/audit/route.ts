import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { complianceService } from '@/lib/compliance/audit';
import { verifyToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    const body = await request.json();
    const { action, entityType, entityId, metadata } = body;

    await complianceService.logAuditEvent({
      action,
      entityType,
      entityId,
      userId,
      tenantId: user?.tenantId || undefined,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Audit log error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      OR: [
        { userId },
        { tenantId: user?.tenantId },
      ],
    };

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLogs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        oldValues: true,
        newValues: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
