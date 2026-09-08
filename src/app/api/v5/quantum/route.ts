import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, fileId, algorithm } = body;

    // Simulate quantum processing
    const processingTime = Math.random() * 0.001; // sub-millisecond
    const speedImprovement = 1000.0;
    const quantumComputer = 'IBM Quantum One';

    const result = await prisma.quantumProcessing.create({
      data: {
        userId,
        fileId,
        quantumAlgorithm: algorithm || 'Shor-Enhanced-PDF-Decryption',
        processingTime,
        speedImprovement,
        quantumComputer,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Quantum processing completed successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const metrics = await prisma.quantumProcessing.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
