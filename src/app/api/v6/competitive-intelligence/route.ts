import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { competitiveIntelligenceService } from '@/lib/competitive-intelligence/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitor = searchParams.get('competitor');

    const intelligence = await prisma.competitiveIntelligence.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (competitor) {
      const analysis = await competitiveIntelligenceService.analyzeCompetitor(competitor);
      const predictions = await competitiveIntelligenceService.predictCompetitorMoves(competitor);
      return NextResponse.json({
        success: true,
        data: { intelligence, analysis, predictions },
      });
    }

    const marketTrends = await competitiveIntelligenceService.monitorMarketTrends();

    return NextResponse.json({
      success: true,
      data: { intelligence, marketTrends },
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
    const { competitorName, analysisType, marketSegment } = body;

    const analysis = await competitiveIntelligenceService.analyzeCompetitor(competitorName);
    const strategy = await competitiveIntelligenceService.generateMarketStrategy();

    const result = await prisma.competitiveIntelligence.create({
      data: {
        competitorName,
        analysisType,
        marketSegment,
        intelligenceData: analysis,
        threatLevel: analysis.threatLevel,
        opportunityScore: 1 - analysis.marketShare,
        actionRecommended: strategy.recommendedActions[0],
        aiConfidence: 0.88,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      analysis,
      strategy,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
