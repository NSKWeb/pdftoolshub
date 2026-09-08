import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  generateFinancialReport,
  getFinancialDashboard,
  getInvestorMetrics,
  approveReport,
  getRevenueByPlan
} from '@/lib/financial/reports';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dashboard = searchParams.get('dashboard');
    const investor = searchParams.get('investor');
    const revenueByPlan = searchParams.get('revenueByPlan');

    if (investor === 'true') {
      if (user.role !== 'admin' && user.role !== 'finance') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const metrics = await getInvestorMetrics();
      return NextResponse.json({ metrics });
    }

    if (dashboard === 'true') {
      const dashboard = await getFinancialDashboard();
      return NextResponse.json({ dashboard });
    }

    if (revenueByPlan === 'true') {
      const revenue = await getRevenueByPlan();
      return NextResponse.json({ revenueByPlan: revenue });
    }

    // Return list of reports
    const { prisma } = await import('@/lib/prisma');
    const reports = await prisma.financialReports.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'finance')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportType, periodStart, periodEnd, currency } = body;
    
    const report = await generateFinancialReport({
      reportType,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      currency
    });
    
    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId } = body;
    
    const report = await approveReport(reportId, user.id);
    
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error approving report:', error);
    return NextResponse.json(
      { error: 'Failed to approve report' },
      { status: 500 }
    );
  }
}
