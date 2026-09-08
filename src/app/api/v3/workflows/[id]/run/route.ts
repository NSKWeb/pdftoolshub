import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { workflowEngine } from '@/lib/workflow/engine';
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
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    // Verify workflow exists and user has access
    const workflow = await prisma.workflows.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { tenantId: user?.tenantId },
          { isTemplate: true },
        ],
      },
    });

    if (!workflow) {
      return NextResponse.json({ message: 'Workflow not found' }, { status: 404 });
    }

    const body = await request.json();
    const { fileId, inputData } = body;

    // Start workflow run
    const run = await workflowEngine.startWorkflowRun(
      id,
      userId,
      user?.tenantId,
      fileId,
      inputData || {}
    );

    // Log the run
    await prisma.analyticsEvents.create({
      data: {
        userId,
        eventType: 'workflow_started',
        eventName: workflow.name,
        properties: { workflowRunId: run.id },
      },
    });

    return NextResponse.json({
      success: true,
      run,
    });
  } catch (error: any) {
    console.error('Start workflow error:', error);
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

    const runs = await prisma.workflowRuns.findMany({
      where: {
        workflowId: id,
        userId,
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        progress: true,
        startedAt: true,
        completedAt: true,
        errorMessage: true,
      },
    });

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error('Get workflow runs error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
