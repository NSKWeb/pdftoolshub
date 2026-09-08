import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrations/enterprise';
import { verifyToken } from '@/lib/session';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    const result = await integrationManager.syncIntegration(id);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    console.error('Sync integration error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    const result = await integrationManager.testConnection(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test integration error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
