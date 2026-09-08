import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { postIpoService } from '@/lib/post-ipo/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quarter = searchParams.get('quarter') || 'Q4';
    const year = parseInt(searchParams.get('year') || '2025');

    const metrics = await postIpoService.getQuarterlyMetrics(quarter, year);
    const operations = await postIpoService.autonomousCompanyOperations();

    const historical = await prisma.postIpoOperations.findMany({
      where: { quarter, year },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { metrics, operations, historical },
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
    const { operationType, quarter, year, sharePrice, marketCap } = body;

    const metrics = await postIpoService.getQuarterlyMetrics(quarter, year);
    const shareholderRelations = await postIpoService.manageShareholderRelations();

    const result = await prisma.postIpoOperations.create({
      data: {
        operationType,
        quarter,
        year,
        sharePrice: sharePrice || metrics.sharePrice,
        marketCap: marketCap || metrics.marketCap,
        tradingVolume: metrics.tradingVolume,
        shareholderMetrics: metrics.shareholderMetrics,
        boardDecisions: {
          autonomous: true,
          confidence: 0.95,
        },
        aiRecommendations: {
          dividend: 'increase',
          buyback: 'execute',
          investment: 'r_and_d',
        },
        autonomousActions: 150,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      metrics,
      shareholderRelations,
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
    const { id, sharePrice, marketCap, autonomousActions } = body;

    const result = await prisma.postIpoOperations.update({
      where: { id },
      data: {
        sharePrice,
        marketCap,
        autonomousActions,
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
