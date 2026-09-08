import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ecosystemService } from '@/lib/ecosdominance/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platformId = searchParams.get('platformId') || 'dittopdf-platform';

    const metrics = await ecosystemService.getEcosystemMetrics(platformId);
    const controlData = await prisma.ecosystemControl.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { metrics, controlData },
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
    const { platformId, platformName } = body;

    const dominance = await ecosystemService.calculatePlatformDominance({
      userBase: 50000000,
      partnerCount: 1000,
      integrationDepth: 0.95,
    });

    const lockIn = await ecosystemService.createEcosystemLockIn('user-sample');

    const result = await prisma.ecosystemControl.create({
      data: {
        platformId: platformId || `platform-${Date.now()}`,
        platformName: platformName || 'Dittopdf Ecosystem',
        controlLevel: 'dominant',
        marketPosition: 'industry_leader',
        integrationDepth: 0.95,
        lockInFactor: lockIn.lockInScore,
        partnerCount: 1000,
        metrics: { dominance, lockIn },
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      dominance,
      lockIn,
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
    const { id, controlLevel, marketPosition } = body;

    const result = await prisma.ecosystemControl.update({
      where: { id },
      data: {
        controlLevel,
        marketPosition,
        updatedAt: new Date(),
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
