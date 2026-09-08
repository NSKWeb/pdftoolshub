import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { marketAcquisitionService } from '@/lib/market-acquisition/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetMarket = searchParams.get('target') || 'all';

    const acquisitions = await prisma.marketAcquisition.findMany({
      take: 20,
      orderBy: { startedAt: 'desc' },
    });

    if (targetMarket !== 'all') {
      const analysis = await marketAcquisitionService.analyzeMarketOpportunity(targetMarket);
      return NextResponse.json({
        success: true,
        data: { acquisitions, analysis },
      });
    }

    return NextResponse.json({
      success: true,
      data: { acquisitions },
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
    const { targetMarket, acquisitionType, investmentAmount, strategy } = body;

    const opportunity = await marketAcquisitionService.analyzeMarketOpportunity(targetMarket);
    const penetration = await marketAcquisitionService.optimizeMarketPenetration(targetMarket);

    const result = await prisma.marketAcquisition.create({
      data: {
        targetMarket,
        acquisitionType,
        strategy: strategy || opportunity.recommendedStrategy,
        investmentAmount: investmentAmount || 100000000,
        projectedROI: opportunity.opportunityScore * 2,
        status: 'active',
        competitorImpact: { threat: 'neutralized' },
        marketShareGain: penetration.penetrationRate,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      opportunity,
      penetration,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, actualROI, completedAt } = body;

    const result = await prisma.marketAcquisition.update({
      where: { id },
      data: {
        status,
        actualROI,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
