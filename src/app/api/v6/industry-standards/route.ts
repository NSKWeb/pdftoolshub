import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ecosystemService } from '@/lib/ecosdominance/service';

export async function GET() {
  try {
    const standards = await prisma.industryStandards.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
    });

    const metrics = {
      totalStandards: await prisma.industryStandards.count(),
      avgAdoptionRate: standards.length > 0
        ? standards.reduce((acc, s) => acc + s.adoptionRate, 0) / standards.length
        : 0,
      avgInfluenceScore: standards.length > 0
        ? standards.reduce((acc, s) => acc + s.influenceScore, 0) / standards.length
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: { standards, metrics },
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
    const { standardId, standardName, category, regulatoryBody, products } = body;

    const standard = await ecosystemService.setIndustryStandard(standardId, {
      name: standardName,
      category,
      regulatoryBody,
      products: products || [],
    });

    const result = await prisma.industryStandards.create({
      data: {
        standardId,
        standardName,
        category,
        adoptionRate: standard.adoptionRate,
        influenceScore: standard.influenceScore,
        regulatoryBody,
        relatedProducts: products || [],
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      standard,
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
    const { id, adoptionRate, influenceScore } = body;

    const result = await prisma.industryStandards.update({
      where: { id },
      data: {
        adoptionRate,
        influenceScore,
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
