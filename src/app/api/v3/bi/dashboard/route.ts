import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics/bi';
import { verifyToken } from '@/lib/session';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'metrics';
    const periodDays = parseInt(searchParams.get('period') || '30');

    if (type === 'metrics') {
      const metrics = await analyticsService.getDashboardMetrics(undefined, periodDays);
      return NextResponse.json({ metrics });
    }

    if (type === 'predictive') {
      const forecast = await analyticsService.getPredictiveAnalytics(undefined, 30);
      return NextResponse.json({ forecast });
    }

    if (type === 'executive') {
      const summary = await analyticsService.getExecutiveSummary();
      return NextResponse.json({ summary });
    }

    return NextResponse.json(
      { message: 'Invalid dashboard type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { name, config, isDefault } = body;

    if (!name || !config) {
      return NextResponse.json(
        { message: 'Name and config required' },
        { status: 400 }
      );
    }

    const dashboard = await analyticsService.createDashboard(
      name,
      config,
      userId,
      undefined,
      isDefault
    );

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error: any) {
    console.error('Create dashboard error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
