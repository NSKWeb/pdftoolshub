import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { classifyDocument, findSimilarDocuments } from '@/lib/ai/classification';
import { verifyToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    const body = await request.json();
    const { fileId, content, findSimilar = false, threshold = 0.7 } = body;

    let documentContent = content;

    if (fileId && !content) {
      const file = await prisma.files.findFirst({
        where: { id: fileId, userId },
      });

      if (!file) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
      }

      // In production, extract text from PDF
      documentContent = `Document: ${file.originalFilename}. Metadata: ${JSON.stringify(file.metadata)}`;
    }

    if (!documentContent) {
      return NextResponse.json(
        { message: 'Content or fileId required' },
        { status: 400 }
      );
    }

    // Classify the document
    const classification = await classifyDocument(
      fileId || 'direct-input',
      documentContent,
      userId
    );

    let similarDocuments = [];
    if (findSimilar) {
      similarDocuments = await findSimilarDocuments(
        user?.tenantId,
        documentContent,
        threshold
      );
    }

    // Log classification event
    await prisma.analyticsEvents.create({
      data: {
        userId,
        eventType: 'document_classified',
        eventName: classification.category,
        properties: {
          confidence: classification.confidence,
          tags: classification.tags,
        },
      },
    });

    return NextResponse.json({
      success: true,
      classification,
      similarDocuments: findSimilar ? similarDocuments : undefined,
    });
  } catch (error: any) {
    console.error('Document classification error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const where: any = {
      OR: [
        { userId },
        { tenantId: user?.tenantId },
      ],
    };

    if (category) {
      where.classification = category;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const files = await prisma.files.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        originalFilename: true,
        classification: true,
        tags: true,
        metadata: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Get classified documents error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
