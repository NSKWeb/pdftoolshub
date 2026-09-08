import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // IPO Readiness report
    const financialReports = await prisma.financialReports.findMany({
      take: 5,
      orderBy: { periodEnd: 'desc' },
    });

    const complianceStatus = await prisma.complianceCertifications.findMany({
      where: { status: 'active' },
    });

    return NextResponse.json({
      success: true,
      data: {
        readinessScore: 95.5,
        financialAudit: 'Completed',
        secCompliance: 'In Progress',
        financialReports,
        complianceStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Simulate filing a document with SEC
    return NextResponse.json({
      success: true,
      message: 'SEC filing initiated',
      filingId: `SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
