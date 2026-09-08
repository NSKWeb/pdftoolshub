import { NextRequest, NextResponse } from 'next/server';
import { billingService } from '@/lib/billing/stripe';
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
    const metricType = searchParams.get('metricType');

    if (metricType) {
      const usage = await billingService.checkUsageLimit(userId, metricType);
      return NextResponse.json({ metricType, ...usage });
    }

    // Get all usage metrics
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const report = await billingService.getUsageReport(userId, startDate, endDate);

    return NextResponse.json({ usage: report });
  } catch (error: any) {
    console.error('Get usage error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
