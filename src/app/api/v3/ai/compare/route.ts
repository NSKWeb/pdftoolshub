import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { compareDocuments } from '@/lib/ai/openai';
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
    const { doc1Content, doc2Content, file1Id, file2Id } = body;

    let content1 = doc1Content;
    let content2 = doc2Content;

    // Fetch file contents if IDs provided
    if (file1Id) {
      const file1 = await prisma.files.findFirst({
        where: { id: file1Id, userId },
      });
      if (!file1) {
        return NextResponse.json({ message: 'File 1 not found' }, { status: 404 });
      }
      content1 = `Document: ${file1.originalFilename}`;
    }

    if (file2Id) {
      const file2 = await prisma.files.findFirst({
        where: { id: file2Id, userId },
      });
      if (!file2) {
        return NextResponse.json({ message: 'File 2 not found' }, { status: 404 });
      }
      content2 = `Document: ${file2.originalFilename}`;
    }

    if (!content1 || !content2) {
      return NextResponse.json(
        { message: 'Both documents required' },
        { status: 400 }
      );
    }

    const result = await compareDocuments(content1, content2);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Compare documents error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
