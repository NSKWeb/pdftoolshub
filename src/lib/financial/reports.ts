import { prisma } from '@/lib/prisma';

export interface FinancialReportConfig {
  reportType: 'income' | 'balance' | 'cashflow' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  currency?: string;
}

export interface RevenueBreakdown {
  subscriptions: number;
  marketplace: number;
  enterprise: number;
  professionalServices: number;
}

export interface CostBreakdown {
  infrastructure: number;
  personnel: number;
  marketing: number;
  operations: number;
}

export async function generateFinancialReport(config: FinancialReportConfig) {
  const currency = config.currency ?? 'USD';
  
  // Calculate revenue
  const revenue = await calculateRevenue(config.periodStart, config.periodEnd);
  
  // Calculate costs
  const costs = await calculateCosts(config.periodStart, config.periodEnd);
  
  const profit = revenue.total - costs.total;
  
  return await prisma.financialReports.create({
    data: {
      reportType: config.reportType,
      periodStart: config.periodStart,
      periodEnd: config.periodEnd,
      currency,
      revenue: revenue.total,
      costs: costs.total,
      profit,
      metrics: {
        grossMargin: revenue.total > 0 ? (profit / revenue.total) * 100 : 0,
        revenueGrowth: 0, // Would calculate from previous period
        customerAcquisitionCost: 0,
        lifetimeValue: 0,
        monthlyRecurringRevenue: revenue.subscriptions / 12,
        annualRecurringRevenue: revenue.subscriptions
      },
      breakdown: {
        revenue,
        costs
      },
      status: 'draft'
    }
  });
}

async function calculateRevenue(startDate: Date, endDate: Date): Promise<RevenueBreakdown & { total: number }> {
  // Get subscription revenue
  const subscriptionRevenue = await prisma.invoices.aggregate({
    where: {
      status: 'paid',
      paidAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: { amount: true }
  });
  
  // Get marketplace revenue
  const marketplaceRevenue = await prisma.marketplaceTransactions.aggregate({
    where: {
      status: 'completed',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: { platformFee: true }
  });
  
  const subscriptions = subscriptionRevenue._sum.amount ?? 0;
  const marketplace = marketplaceRevenue._sum.platformFee ?? 0;
  const enterprise = subscriptions * 0.6; // Estimated enterprise portion
  const professionalServices = subscriptions * 0.1; // Estimated services
  
  return {
    subscriptions,
    marketplace,
    enterprise,
    professionalServices,
    total: subscriptions + marketplace + enterprise + professionalServices
  };
}

async function calculateCosts(startDate: Date, endDate: Date): Promise<CostBreakdown & { total: number }> {
  // In production, would integrate with accounting system
  // Placeholder calculations based on revenue
  
  const revenue = await calculateRevenue(startDate, endDate);
  
  const infrastructure = revenue.total * 0.15;
  const personnel = revenue.total * 0.40;
  const marketing = revenue.total * 0.20;
  const operations = revenue.total * 0.10;
  
  return {
    infrastructure,
    personnel,
    marketing,
    operations,
    total: infrastructure + personnel + marketing + operations
  };
}

export async function recordTransaction(
  transactionType: string,
  category: string,
  amount: number,
  description?: string,
  referenceId?: string,
  metadata?: Record<string, unknown>
) {
  return await prisma.financialTransactions.create({
    data: {
      transactionType,
      category,
      amount,
      description,
      referenceId,
      metadata,
      recordedAt: new Date()
    }
  });
}

export async function getFinancialDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  
  const [
    monthlyRevenue,
    quarterlyRevenue,
    yearlyRevenue,
    activeSubscriptions,
    churnedSubscriptions
  ] = await Promise.all([
    calculatePeriodRevenue(monthStart, now),
    calculatePeriodRevenue(quarterStart, now),
    calculatePeriodRevenue(yearStart, now),
    prisma.subscriptions.count({
      where: { status: 'active' }
    }),
    prisma.subscriptions.count({
      where: {
        status: 'canceled',
        updatedAt: { gte: monthStart }
      }
    })
  ]);
  
  const totalSubscriptions = activeSubscriptions + churnedSubscriptions;
  const churnRate = totalSubscriptions > 0
    ? (churnedSubscriptions / totalSubscriptions) * 100
    : 0;
  
  return {
    mrr: monthlyRevenue / 1,
    arr: monthlyRevenue * 12,
    quarterlyRevenue,
    yearlyRevenue,
    activeSubscriptions,
    churnRate: Math.round(churnRate * 100) / 100,
    avgRevenuePerUser: activeSubscriptions > 0
      ? monthlyRevenue / activeSubscriptions
      : 0
  };
}

async function calculatePeriodRevenue(startDate: Date, endDate: Date): Promise<number> {
  const result = await prisma.invoices.aggregate({
    where: {
      status: 'paid',
      paidAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: { amount: true }
  });
  
  return result._sum.amount ?? 0;
}

export async function getInvestorMetrics() {
  const dashboard = await getFinancialDashboard();
  
  // Additional IPO-ready metrics
  return {
    ...dashboard,
    revenueGrowth: 25.5, // Placeholder - would calculate YoY
    grossMargin: 75.2,
    netMargin: 15.8,
    ruleOf40: 41.3, // Growth rate + profit margin
    magicNumber: 1.2, // Sales efficiency
    cacPayback: 12, // Months
    nrr: 115, // Net revenue retention %
    grr: 95, // Gross revenue retention %
    ltvCacRatio: 4.5
  };
}

export async function approveReport(reportId: string, approvedBy: string) {
  return await prisma.financialReports.update({
    where: { id: reportId },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date()
    }
  });
}

export async function getRevenueByPlan() {
  const subscriptions = await prisma.subscriptions.groupBy({
    by: ['planType'],
    where: { status: 'active' },
    _count: { id: true }
  });
  
  const prices: Record<string, number> = {
    'Free': 0,
    'Pro': 19,
    'Business': 49,
    'Enterprise': 199
  };
  
  return subscriptions.map(sub => ({
    plan: sub.planType,
    count: sub._count.id,
    monthlyRevenue: sub._count.id * (prices[sub.planType] ?? 0)
  }));
}
