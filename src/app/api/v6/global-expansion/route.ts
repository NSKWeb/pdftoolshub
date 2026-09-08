import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { marketAcquisitionService } from '@/lib/market-acquisition/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    const expansions = await prisma.globalExpansion.findMany({
      take: 30,
      orderBy: { startedAt: 'desc' },
    });

    if (region) {
      const penetration = await marketAcquisitionService.optimizeMarketPenetration(region);
      return NextResponse.json({
        success: true,
        data: { expansions, penetration },
      });
    }

    return NextResponse.json({
      success: true,
      data: { expansions },
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
    const { regionCode, regionName, entryStrategy, investmentAmount } = body;

    const penetration = await marketAcquisitionService.optimizeMarketPenetration(regionCode);

    const result = await prisma.globalExpansion.create({
      data: {
        regionCode,
        regionName,
        expansionStage: 'execution',
        entryStrategy: entryStrategy || 'partnership_led',
        investmentAmount: investmentAmount || 50000000,
        projectedRevenue: investmentAmount * 3,
        marketPenetration: penetration.penetrationRate,
        culturalAdaptation: {
          language: true,
          customs: true,
          payment: true,
          compliance: true,
        },
        aiRecommendations: {
          localPartners: ['Partner A', 'Partner B'],
          marketingChannels: ['digital', 'events'],
          pricing: 'market_aligned',
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
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
    const { id, expansionStage, actualRevenue, launchedAt } = body;

    const result = await prisma.globalExpansion.update({
      where: { id },
      data: {
        expansionStage,
        actualRevenue,
        launchedAt: launchedAt ? new Date(launchedAt) : null,
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
