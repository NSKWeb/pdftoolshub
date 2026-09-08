import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { answerDocumentQuestion } from '@/lib/ai/openai';
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

    const body = await request.json();
    const { fileId, question, documentContent } = body;

    if (!question) {
      return NextResponse.json(
        { message: 'Question required' },
        { status: 400 }
      );
    }

    let content = documentContent;

    if (fileId && !content) {
      const file = await prisma.files.findFirst({
        where: { id: fileId, userId },
      });

      if (!file) {
        return NextResponse.json({ message: 'File not found' }, { status: 404 });
      }

      // In production, extract text from PDF
      content = `Document: ${file.originalFilename}`;
    }

    if (!content) {
      return NextResponse.json(
        { message: 'Document content or fileId required' },
        { status: 400 }
      );
    }

    const result = await answerDocumentQuestion(content, question);

    return NextResponse.json({
      success: true,
      question,
      answer: result.answer,
      confidence: result.confidence,
      sourceSection: result.sourceSection,
    });
  } catch (error: any) {
    console.error('Document Q&A error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
