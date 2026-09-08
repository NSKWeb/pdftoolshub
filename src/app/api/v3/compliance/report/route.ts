import { NextRequest, NextResponse } from 'next/server';
import { complianceService } from '@/lib/compliance/audit';
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
    const type = searchParams.get('type') || 'full';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (type === 'checks') {
      const checks = await complianceService.runComplianceChecks();
      return NextResponse.json({ checks });
    }

    if (type === 'gdpr') {
      const gdprCheck = await complianceService.checkGDPR();
      return NextResponse.json({ check: gdprCheck });
    }

    if (type === 'soc2') {
      const soc2Check = await complianceService.checkSOC2();
      return NextResponse.json({ check: soc2Check });
    }

    // Full report
    const report = await complianceService.generateComplianceReport(undefined, start, end);

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error('Compliance report error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
