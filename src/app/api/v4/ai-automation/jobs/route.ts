import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  createAutomationJob,
  processAutomationJob,
  getPendingJobs,
  getJobStats
} from '@/lib/ai-automation/intelligent';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pending = searchParams.get('pending');
    const stats = searchParams.get('stats');
    const timeRange = (searchParams.get('timeRange') as '1h' | '24h' | '7d') ?? '24h';

    if (stats === 'true') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const jobStats = await getJobStats(timeRange);
      return NextResponse.json({ stats: jobStats });
    }

    if (pending === 'true') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const jobs = await getPendingJobs(20);
      return NextResponse.json({ jobs });
    }

    // Return user's jobs
    const { prisma } = await import('@/lib/prisma');
    const jobs = await prisma.aIAutomationJobs.findMany({
      where: {
        OR: [
          { userId: user.id },
          { tenantId: user.tenantId ?? undefined }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobType,
      automationType,
      inputData,
      mlModelId
    } = body;
    
    const job = await createAutomationJob({
      tenantId: user.tenantId ?? undefined,
      userId: user.id,
      jobType,
      automationType,
      inputData,
      mlModelId
    });
    
    // Process job immediately (in production, would queue this)
    const result = await processAutomationJob(job.id);
    
    return NextResponse.json({
      job,
      result
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}
