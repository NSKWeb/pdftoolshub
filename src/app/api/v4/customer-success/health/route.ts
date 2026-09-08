import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  calculateHealthScore,
  getAtRiskCustomers,
  getHealthScoreDistribution
} from '@/lib/customer-success/health';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const atRisk = searchParams.get('atRisk');
    const distribution = searchParams.get('distribution');

    if (atRisk === 'true') {
      if (user.role !== 'admin' && user.role !== 'customer_success') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const customers = await getAtRiskCustomers();
      return NextResponse.json({ customers });
    }

    if (distribution === 'true') {
      const dist = await getHealthScoreDistribution();
      return NextResponse.json({ distribution: dist });
    }

    if (tenantId) {
      // Users can only get their own tenant's health score
      if (tenantId !== user.tenantId && user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const healthScore = await calculateHealthScore(tenantId);
      return NextResponse.json({ healthScore });
    }

    return NextResponse.json(
      { error: 'Missing tenantId parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching health score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health score' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId' },
        { status: 400 }
      );
    }

    // Users can only calculate their own tenant's health score
    if (tenantId !== user.tenantId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const healthScore = await calculateHealthScore(tenantId);
    
    return NextResponse.json({ healthScore });
  } catch (error) {
    console.error('Error calculating health score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    );
  }
}
