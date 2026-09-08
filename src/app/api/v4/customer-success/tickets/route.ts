import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  createSupportTicket,
  getSupportMetrics,
  getTicketsByCategory
} from '@/lib/customer-success/support';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metrics = searchParams.get('metrics');
    const categories = searchParams.get('categories');
    const timeRange = (searchParams.get('timeRange') as '7d' | '30d' | '90d') ?? '30d';

    if (metrics === 'true') {
      if (user.role !== 'admin' && user.role !== 'customer_success' && user.role !== 'support') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const stats = await getSupportMetrics(timeRange);
      return NextResponse.json({ metrics: stats });
    }

    if (categories === 'true') {
      const cats = await getTicketsByCategory(timeRange);
      return NextResponse.json({ categories: cats });
    }

    // Return user's tickets or all tickets for support staff
    const where: {
      userId?: string;
      tenantId?: string;
    } = {};
    
    if (user.role !== 'admin' && user.role !== 'support') {
      where.userId = user.id;
      if (user.tenantId) {
        where.tenantId = user.tenantId;
      }
    }
    
    const tickets = await prisma.supportTickets.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
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
    const { subject, description, category, priority } = body;
    
    const ticket = await createSupportTicket({
      userId: user.id,
      tenantId: user.tenantId ?? undefined,
      subject,
      description,
      category,
      priority
    });
    
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
