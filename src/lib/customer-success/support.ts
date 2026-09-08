import { prisma } from '@/lib/prisma';

export interface TicketInput {
  tenantId?: string;
  userId: string;
  subject: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export async function createSupportTicket(input: TicketInput) {
  const ticketNumber = await generateTicketNumber();
  
  // AI classification
  const aiClassification = await classifyTicket(input.subject, input.description);
  const aiSuggestedResponse = await suggestResponse(input.subject, input.description);
  
  // Auto-assign based on category
  const assignedTo = await getAgentForCategory(aiClassification.category);
  
  return await prisma.supportTickets.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      ticketNumber,
      subject: input.subject,
      description: input.description,
      category: aiClassification.category,
      priority: aiClassification.priority,
      assignedTo,
      aiClassification: aiClassification.category,
      aiSuggestedResponse,
      status: 'open'
    }
  });
}

async function generateTicketNumber(): Promise<string> {
  const date = new Date();
  const prefix = 'TIC';
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Get count of tickets this month
  const count = await prisma.supportTickets.count({
    where: {
      createdAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), 1)
      }
    }
  });
  
  const sequence = (count + 1).toString().padStart(5, '0');
  return `${prefix}-${year}${month}-${sequence}`;
}

async function classifyTicket(
  subject: string,
  description?: string
): Promise<{ category: string; priority: 'low' | 'medium' | 'high' | 'urgent' }> {
  const text = `${subject} ${description ?? ''}`.toLowerCase();
  
  // Simple rule-based classification
  // In production, would use ML model
  
  const categories: { [key: string]: string[] } = {
    'billing': ['payment', 'invoice', 'billing', 'charge', 'subscription', 'refund'],
    'technical': ['error', 'bug', 'issue', 'not working', 'failed', 'crash'],
    'feature': ['feature', 'enhancement', 'request', 'suggestion', 'add'],
    'account': ['login', 'password', 'account', 'access', 'authentication'],
    'integration': ['api', 'webhook', 'integration', 'sync', 'connector']
  };
  
  let bestCategory = 'general';
  let maxMatches = 0;
  
  for (const [category, keywords] of Object.entries(categories)) {
    const matches = keywords.filter(kw => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  }
  
  // Determine priority
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  
  const urgentKeywords = ['urgent', 'critical', 'down', 'outage', 'security', 'breach'];
  const highKeywords = ['important', 'blocking', 'unable', 'error'];
  
  if (urgentKeywords.some(kw => text.includes(kw))) {
    priority = 'urgent';
  } else if (highKeywords.some(kw => text.includes(kw))) {
    priority = 'high';
  } else if (maxMatches === 0) {
    priority = 'low';
  }
  
  return { category: bestCategory, priority };
}

async function suggestResponse(subject: string, description?: string): Promise<string | null> {
  // In production, would use AI to suggest response
  // Placeholder with common responses
  
  const text = `${subject} ${description ?? ''}`.toLowerCase();
  
  if (text.includes('password') || text.includes('login')) {
    return 'Thank you for contacting us. You can reset your password by clicking "Forgot Password" on the login page. If you continue to experience issues, please let us know.';
  }
  
  if (text.includes('billing') || text.includes('invoice')) {
    return 'Thank you for reaching out about billing. Our team will review your account and get back to you within 24 hours with more information.';
  }
  
  return null;
}

async function getAgentForCategory(category: string): Promise<string | null> {
  // In production, would check agent availability and workload
  // Placeholder assignment logic
  
  const agentMap: Record<string, string> = {
    'billing': 'billing-agent-1',
    'technical': 'tech-agent-1',
    'feature': 'product-agent-1',
    'account': 'support-agent-1',
    'integration': 'api-agent-1'
  };
  
  return agentMap[category] ?? null;
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
) {
  const updateData: {
    status: string;
    resolvedAt?: Date;
  } = { status };
  
  if (status === 'resolved') {
    updateData.resolvedAt = new Date();
    
    // Calculate resolution time
    const ticket = await prisma.supportTickets.findUnique({
      where: { id: ticketId }
    });
    
    if (ticket) {
      const resolutionTime = Math.round(
        (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60) // minutes
      );
      
      await prisma.supportTickets.update({
        where: { id: ticketId },
        data: {
          ...updateData,
          resolutionTime
        }
      });
      
      return;
    }
  }
  
  await prisma.supportTickets.update({
    where: { id: ticketId },
    data: updateData
  });
}

export async function assignTicket(ticketId: string, agentId: string) {
  return await prisma.supportTickets.update({
    where: { id: ticketId },
    data: {
      assignedTo: agentId,
      status: 'in_progress'
    }
  });
}

export async function addSatisfactionScore(
  ticketId: string,
  score: number
) {
  return await prisma.supportTickets.update({
    where: { id: ticketId },
    data: { satisfactionScore: score }
  });
}

export async function getSupportMetrics(timeRange: '7d' | '30d' | '90d') {
  const days = { '7d': 7, '30d': 30, '90d': 90 };
  const since = new Date(Date.now() - days[timeRange] * 24 * 60 * 60 * 1000);
  
  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    avgResolutionTime,
    satisfactionScores
  ] = await Promise.all([
    prisma.supportTickets.count({
      where: { createdAt: { gte: since } }
    }),
    prisma.supportTickets.count({
      where: {
        createdAt: { gte: since },
        status: { in: ['open', 'in_progress'] }
      }
    }),
    prisma.supportTickets.count({
      where: {
        createdAt: { gte: since },
        status: 'resolved'
      }
    }),
    prisma.supportTickets.aggregate({
      where: {
        createdAt: { gte: since },
        status: 'resolved',
        resolutionTime: { not: null }
      },
      _avg: { resolutionTime: true }
    }),
    prisma.supportTickets.findMany({
      where: {
        createdAt: { gte: since },
        satisfactionScore: { not: null }
      },
      select: { satisfactionScore: true }
    })
  ]);
  
  const avgSatisfaction = satisfactionScores.length > 0
    ? satisfactionScores.reduce((sum, s) => sum + (s.satisfactionScore ?? 0), 0) / satisfactionScores.length
    : 0;
  
  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0,
    avgResolutionTime: Math.round(avgResolutionTime._avg.resolutionTime ?? 0),
    avgSatisfaction: Math.round(avgSatisfaction * 10) / 10
  };
}

export async function getTicketsByCategory(timeRange: '7d' | '30d' | '90d') {
  const days = { '7d': 7, '30d': 30, '90d': 90 };
  const since = new Date(Date.now() - days[timeRange] * 24 * 60 * 60 * 1000);
  
  const categories = await prisma.supportTickets.groupBy({
    by: ['category'],
    where: { createdAt: { gte: since } },
    _count: { id: true }
  });
  
  return categories.map(c => ({
    category: c.category ?? 'uncategorized',
    count: c._count.id
  }));
}
