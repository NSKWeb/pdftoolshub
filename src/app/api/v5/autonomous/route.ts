import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const systems = await prisma.autonomousSystems.findMany();
    return NextResponse.json({ success: true, data: systems });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { systemType, status, healthScore } = body;

    const result = await prisma.autonomousSystems.create({
      data: {
        systemType,
        status: status || 'Operational',
        healthScore: healthScore || 100.0,
        autoScalingEnabled: true,
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, healthScore } = body;

    const result = await prisma.autonomousSystems.update({
      where: { id },
      data: {
        status,
        healthScore,
        lastHealthCheck: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
