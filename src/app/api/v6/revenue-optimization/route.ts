import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revenueOptimizationService } from '@/lib/revenue-optimization/service';

export async function GET() {
  try {
    const revenueData = await prisma.autonomousRevenue.findMany({
      take: 50,
      orderBy: { appliedAt: 'desc' },
    });

    const streams = await revenueOptimizationService.generateRevenueStreams();
    const autonomous = await revenueOptimizationService.autonomousRevenueGeneration();

    return NextResponse.json({
      success: true,
      data: { revenueData, streams, autonomous },
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
    const { revenueStream, optimizationType, baselineRevenue } = body;

    const pricing = await revenueOptimizationService.optimizePricing('dynamic_value_based');
    const margins = await revenueOptimizationService.optimizeProfitMargins();

    const optimizedRevenue = baselineRevenue * (1 + pricing.improvement);

    const result = await prisma.autonomousRevenue.create({
      data: {
        revenueStream,
        optimizationType,
        aiModelUsed: 'DittoRevenue AI v6.0',
        baselineRevenue,
        optimizedRevenue,
        improvementPercent: pricing.improvement,
        pricingStrategy: pricing.strategy,
        marketConditions: { competitive: 'favorable', demand: 'high' },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      pricing,
      margins,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
