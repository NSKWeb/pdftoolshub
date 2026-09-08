import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { integrationManager } from '@/lib/integrations/enterprise';
import { verifyToken } from '@/lib/session';

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

    if (!user?.tenantId) {
      return NextResponse.json({ integrations: [] });
    }

    const integrations = await prisma.tenantIntegrations.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        integrationType: true,
        status: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

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

    if (!user?.tenantId) {
      return NextResponse.json(
        { message: 'Tenant required for integrations' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { provider, type, credentials, settings } = body;

    if (!provider || !type || !credentials) {
      return NextResponse.json(
        { message: 'Provider, type, and credentials required' },
        { status: 400 }
      );
    }

    const integration = await integrationManager.createIntegration(
      user.tenantId,
      provider,
      type,
      {
        provider,
        type,
        credentials,
        settings: settings || {},
      }
    );

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error: any) {
    console.error('Create integration error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
