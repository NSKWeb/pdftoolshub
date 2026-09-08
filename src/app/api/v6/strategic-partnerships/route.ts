import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { strategicPartnershipsService } from '@/lib/strategic-partnerships/service';

export async function GET() {
  try {
    const partnerships = await prisma.strategicPartnerships.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
    });

    const portfolio = await strategicPartnershipsService.manageAlliancePortfolio();

    return NextResponse.json({
      success: true,
      data: { partnerships, portfolio },
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
    const { partnerName, partnerType, contractValue, revenueShare } = body;

    const opportunities = await strategicPartnershipsService.identifyPartnershipOpportunities({
      minScore: 0.85,
    });

    const value = await strategicPartnershipsService.calculatePartnershipValue({
      revenue: contractValue,
      synergyScore: 0.75,
      connections: 50,
    });

    const result = await prisma.strategicPartnerships.create({
      data: {
        partnerName,
        partnerType,
        partnershipLevel: 'strategic',
        contractValue: contractValue || 10000000,
        revenueShare: revenueShare || 0.30,
        synergies: { estimatedValue: value.totalValue },
        automationLevel: 0.92,
        status: 'active',
        aiManaged: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      opportunities,
      value,
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
    const { id, status, automationLevel } = body;

    const result = await prisma.strategicPartnerships.update({
      where: { id },
      data: {
        status,
        automationLevel,
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
