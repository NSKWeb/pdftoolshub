import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeDocument, AIAnalysisType } from '@/lib/ai/openai';
import { verifyToken } from '@/lib/session';
import { billingService } from '@/lib/billing/stripe';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Check AI analysis usage limit
    const usageCheck = await billingService.checkUsageLimit(userId, 'aiAnalysis');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { message: 'AI analysis limit exceeded. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileId, analysisType, content, options } = body;

    if (!analysisType || !['summarize', 'extract_entities', 'classify', 'optimize', 'quality_check', 'layout_suggestions', 'content_analysis'].includes(analysisType)) {
      return NextResponse.json(
        { message: 'Invalid analysis type' },
        { status: 400 }
      );
    }

    let documentContent = content;

    // If fileId provided, get content from file
    if (fileId && !content) {
      const file = await prisma.files.findFirst({
        where: { id: fileId, userId },
      });

      if (!file) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
      }

      // In production, extract text from PDF
      // For now, use a placeholder
      documentContent = `Document: ${file.originalFilename}`;
    }

    if (!documentContent) {
      return NextResponse.json(
        { message: 'Content or fileId required' },
        { status: 400 }
      );
    }

    // Perform AI analysis
    const result = await analyzeDocument(
      userId,
      fileId || 'direct-input',
      analysisType as AIAnalysisType,
      documentContent,
      options
    );

    // Record usage
    await billingService.recordUsage(userId, 'aiAnalysis');

    // Log the event
    await prisma.analyticsEvents.create({
      data: {
        userId,
        eventType: 'ai_analysis',
        eventName: analysisType,
        properties: { fileId, hasContent: !!content },
      },
    });

    return NextResponse.json({
      success: true,
      analysisType,
      result,
    });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { message: error.message || 'Analysis failed' },
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

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId };
    if (fileId) where.fileId = fileId;

    const jobs = await prisma.aiJobs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        jobType: true,
        aiModel: true,
        status: true,
        confidenceScore: true,
        processingTime: true,
        createdAt: true,
        fileId: true,
      },
    });

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Get AI jobs error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
