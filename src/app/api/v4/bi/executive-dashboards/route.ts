import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const defaultOnly = searchParams.get('default');

    const where: {
      tenantId?: string | null;
      isDefault?: boolean;
    } = {};

    if (user.tenantId) {
      where.tenantId = user.tenantId;
    }

    if (defaultOnly === 'true') {
      where.isDefault = true;
    }

    const dashboards = await prisma.executiveDashboards.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ dashboards });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'executive')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      dashboardType,
      config,
      kpis,
      refreshInterval,
      isDefault,
      isShared
    } = body;

    const dashboard = await prisma.executiveDashboards.create({
      data: {
        tenantId: user.tenantId,
        name,
        description,
        dashboardType,
        config: config ?? {},
        kpis: kpis ?? {},
        refreshInterval: refreshInterval ?? 300,
        isDefault: isDefault ?? false,
        isShared: isShared ?? false
      }
    });

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dashboardId, config, kpis } = body;

    // Check ownership
    const existing = await prisma.executiveDashboards.findUnique({
      where: { id: dashboardId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 }
      );
    }

    if (existing.tenantId !== user.tenantId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const dashboard = await prisma.executiveDashboards.update({
      where: { id: dashboardId },
      data: {
        config: config ?? existing.config,
        kpis: kpis ?? existing.kpis,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ dashboard });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to update dashboard' },
      { status: 500 }
    );
  }
}
