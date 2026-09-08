import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelName, modelType, version, accuracyScore, trainingDataSize, inferenceSpeed } = body;

    const result = await prisma.phase5AiModels.create({
      data: {
        modelName,
        modelType,
        version,
        accuracyScore: accuracyScore || 0.99,
        trainingDataSize: BigInt(trainingDataSize || 1000000000),
        inferenceSpeed: inferenceSpeed || 0.05,
        isActive: true,
      },
    });

    const serializedResult = {
      ...result,
      trainingDataSize: result.trainingDataSize.toString(),
    };

    return NextResponse.json({
      success: true,
      data: serializedResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const models = await prisma.phase5AiModels.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const serializedModels = models.map(m => ({
      ...m,
      trainingDataSize: m.trainingDataSize.toString(),
    }));

    return NextResponse.json({ success: true, data: serializedModels });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
