import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const markets = await prisma.globalMarkets.findMany();
    const serializedMarkets = markets.map(m => ({
      ...m,
      marketSize: m.marketSize.toString(),
    }));
    return NextResponse.json({ success: true, data: serializedMarkets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { countryCode, currency, languageCode, complianceRequirements, marketSize, marketShare } = body;

    const result = await prisma.globalMarkets.create({
      data: {
        countryCode,
        currency,
        languageCode,
        complianceRequirements: complianceRequirements || {},
        marketSize: BigInt(marketSize || 0),
        marketShare: marketShare || 0,
      },
    });

    const serializedResult = {
      ...result,
      marketSize: result.marketSize.toString(),
    };

    return NextResponse.json({ success: true, data: serializedResult });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
