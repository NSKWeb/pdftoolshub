import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { autonomousBusinessService } from '@/lib/autonomous-business/service';

export async function GET() {
  try {
    const decisions = await prisma.autonomousDecisions.findMany({
      take: 50,
      orderBy: { executedAt: 'desc' },
    });

    const metrics = {
      totalDecisions: await prisma.autonomousDecisions.count(),
      avgConfidence: decisions.length > 0
        ? decisions.reduce((acc, d) => acc + (d.confidenceScore || 0), 0) / decisions.length
        : 0,
      automationRate: 0.96,
    };

    return NextResponse.json({
      success: true,
      data: { decisions, metrics },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { decisionType, context, approvedBy } = body;

    const aiDecision = await autonomousBusinessService.makeDecision(decisionType, context);

    const result = await prisma.autonomousDecisions.create({
      data: {
        decisionType,
        decisionContext: context,
        aiAnalysis: aiDecision.aiAnalysis,
        decisionOutcome: aiDecision.decisionOutcome,
        confidenceScore: aiDecision.confidenceScore,
        approvedBy: aiDecision.requiresApproval ? approvedBy : null,
      },
    });

    if (!aiDecision.requiresApproval) {
      await autonomousBusinessService.executeAutonomousOperation(aiDecision.decisionOutcome);
    }

    return NextResponse.json({
      success: true,
      data: result,
      requiresApproval: aiDecision.requiresApproval,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
