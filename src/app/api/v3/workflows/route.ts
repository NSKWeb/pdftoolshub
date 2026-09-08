import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { workflowEngine, WorkflowDefinition, WorkflowTrigger } from '@/lib/workflow/engine';
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
    const { name, description, definition, triggers, isTemplate, category } = body;

    if (!name || !definition || !triggers) {
      return NextResponse.json(
        { message: 'Name, definition, and triggers required' },
        { status: 400 }
      );
    }

    const workflow = await workflowEngine.createWorkflow(
      userId,
      user?.tenantId,
      name,
      description,
      definition as WorkflowDefinition,
      triggers as WorkflowTrigger[]
    );

    // Log the creation
    await prisma.analyticsEvents.create({
      data: {
        userId,
        eventType: 'workflow_created',
        eventName: name,
        properties: { isTemplate, category },
      },
    });

    return NextResponse.json({
      success: true,
      workflow,
    });
  } catch (error: any) {
    console.error('Create workflow error:', error);
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
    const isTemplate = searchParams.get('isTemplate');
    const category = searchParams.get('category');

    const where: any = {
      OR: [
        { userId },
        { tenantId: user?.tenantId },
        { isTemplate: true },
      ],
    };

    if (isTemplate !== null) {
      where.isTemplate = isTemplate === 'true';
    }

    if (category) {
      where.category = category;
    }

    const workflows = await prisma.workflows.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        isTemplate: true,
        category: true,
        triggers: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
