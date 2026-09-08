import { prisma } from '../prisma';

export interface DashboardMetrics {
  period: { start: Date; end: Date };
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalFiles: number;
    totalStorage: number;
    apiCalls: number;
    revenue: number;
  };
  usage: {
    byTool: Array<{ tool: string; count: number }>;
    byDay: Array<{ date: string; count: number }>;
    byHour: Array<{ hour: number; count: number }>;
  };
  users: {
    newUsers: number;
    returningUsers: number;
    churnRate: number;
    byPlan: Array<{ plan: string; count: number }>;
  };
  performance: {
    avgProcessingTime: number;
    successRate: number;
    errorRate: number;
  };
}

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  target: number;
  unit: string;
  calculation: string;
}

export class AnalyticsService {
  async trackEvent(
    eventType: string,
    eventName: string,
    properties?: Record<string, any>,
    userId?: string,
    tenantId?: string
  ): Promise<void> {
    await prisma.analyticsEvents.create({
      data: {
        userId,
        tenantId,
        eventType,
        eventName,
        properties,
      },
    });
  }

  async getDashboardMetrics(
    tenantId?: string,
    periodDays: number = 30
  ): Promise<DashboardMetrics> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalFiles,
      apiCalls,
      revenue,
      usageByTool,
      usageByDay,
      newUsers,
      usersByPlan,
      processingStats,
    ] = await Promise.all([
      // Total users
      prisma.users.count({
        where: tenantId ? { tenantId } : {},
      }),

      // Active users (have activity in period)
      prisma.usageLogs.groupBy({
        by: ['userId'],
        where: {
          ...(tenantId ? { tenantId } : {}),
          timestamp: { gte: startDate, lte: endDate },
        },
        _count: { userId: true },
      }).then(results => results.length),

      // Total files
      prisma.files.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          createdAt: { lte: endDate },
        },
      }),

      // API calls
      prisma.analyticsEvents.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          eventType: 'api_call',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // Revenue
      prisma.invoices.aggregate({
        where: {
          ...(tenantId ? { subscription: { tenantId } } : {}),
          status: 'paid',
          paidAt: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }).then(r => r._sum.amount || 0),

      // Usage by tool
      prisma.usageLogs.groupBy({
        by: ['toolUsed'],
        where: {
          ...(tenantId ? { tenantId } : {}),
          timestamp: { gte: startDate, lte: endDate },
        },
        _count: { toolUsed: true },
      }),

      // Usage by day
      prisma.$queryRaw`
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM "UsageLogs"
        WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
        ${tenantId ? prisma.$queryRaw`AND "tenantId" = ${tenantId}` : prisma.$queryRaw``}
        GROUP BY DATE(timestamp)
        ORDER BY date
      `,

      // New users
      prisma.users.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          createdAt: { gte: startDate, lte: endDate },
        },
      }),

      // Users by plan
      prisma.users.groupBy({
        by: ['planType'],
        where: tenantId ? { tenantId } : {},
        _count: { planType: true },
      }),

      // Processing stats
      prisma.aiJobs.aggregate({
        where: {
          ...(tenantId ? { tenantId } : {}),
          createdAt: { gte: startDate, lte: endDate },
        },
        _avg: { processingTime: true },
      }),
    ]);

    // Calculate storage
    const storageResult = await prisma.files.aggregate({
      where: {
        ...(tenantId ? { tenantId } : {}),
      },
      _sum: { fileSize: true },
    });
    const totalStorage = (storageResult._sum.fileSize || 0) / (1024 * 1024 * 1024); // Convert to GB

    // Calculate hourly usage
    const usageByHour = await prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as count
      FROM "UsageLogs"
      WHERE timestamp >= ${startDate} AND timestamp <= ${endDate}
      ${tenantId ? prisma.$queryRaw`AND "tenantId" = ${tenantId}` : prisma.$queryRaw``}
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour
    `;

    // Calculate returning users (active - new)
    const returningUsers = Math.max(0, activeUsers - newUsers);

    // Calculate churn (simplified)
    const previousPeriodUsers = await prisma.users.count({
      where: {
        ...(tenantId ? { tenantId } : {}),
        createdAt: { 
          gte: new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000),
          lt: startDate,
        },
      },
    });
    const churnRate = previousPeriodUsers > 0 
      ? ((previousPeriodUsers - returningUsers) / previousPeriodUsers) * 100 
      : 0;

    // Calculate success/error rates
    const [successJobs, failedJobs] = await Promise.all([
      prisma.aiJobs.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: 'completed',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.aiJobs.count({
        where: {
          ...(tenantId ? { tenantId } : {}),
          status: 'failed',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    const totalJobs = successJobs + failedJobs;

    return {
      period: { start: startDate, end: endDate },
      overview: {
        totalUsers,
        activeUsers,
        totalFiles,
        totalStorage,
        apiCalls,
        revenue,
      },
      usage: {
        byTool: (usageByTool || []).map(u => ({
          tool: u.toolUsed,
          count: u._count.toolUsed,
        })),
        byDay: (usageByDay || []).map((u: any) => ({
          date: u.date.toISOString().split('T')[0],
          count: Number(u.count),
        })),
        byHour: (usageByHour || []).map((u: any) => ({
          hour: Number(u.hour),
          count: Number(u.count),
        })),
      },
      users: {
        newUsers,
        returningUsers,
        churnRate,
        byPlan: (usersByPlan || []).map(u => ({
          plan: u.planType,
          count: u._count.planType,
        })),
      },
      performance: {
        avgProcessingTime: Math.round((processingStats._avg.processingTime || 0)),
        successRate: totalJobs > 0 ? (successJobs / totalJobs) * 100 : 0,
        errorRate: totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0,
      },
    };
  }

  async getPredictiveAnalytics(
    tenantId?: string,
    forecastDays: number = 30
  ): Promise<{
    projectedUsers: number;
    projectedRevenue: number;
    projectedUsage: number;
    confidence: number;
    trends: Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change: number }>;
  }> {
    const last90Days = await this.getDashboardMetrics(tenantId, 90);
    const last30Days = await this.getDashboardMetrics(tenantId, 30);
    const last7Days = await this.getDashboardMetrics(tenantId, 7);

    // Simple linear projection based on recent trends
    const dailyGrowthRate = last30Days.overview.totalUsers > 0
      ? (last7Days.overview.totalUsers - (last30Days.overview.totalUsers * 7 / 30)) / (last30Days.overview.totalUsers * 7 / 30)
      : 0;

    const projectedUsers = Math.round(last30Days.overview.totalUsers * (1 + dailyGrowthRate * forecastDays));

    const dailyRevenueGrowth = last30Days.overview.revenue > 0
      ? (last7Days.overview.revenue - (last30Days.overview.revenue * 7 / 30)) / (last30Days.overview.revenue * 7 / 30)
      : 0;

    const projectedRevenue = last30Days.overview.revenue * (1 + dailyRevenueGrowth * (forecastDays / 30));

    const usageGrowth = last30Days.usage.byDay.length > 0
      ? last7Days.usage.byDay.reduce((sum, d) => sum + d.count, 0) / 7
      : 0;

    const projectedUsage = Math.round(usageGrowth * forecastDays);

    // Calculate trends
    const trends = [
      {
        metric: 'User Growth',
        direction: dailyGrowthRate > 0.01 ? 'up' : dailyGrowthRate < -0.01 ? 'down' : 'stable',
        change: Math.round(dailyGrowthRate * 100),
      },
      {
        metric: 'Revenue',
        direction: dailyRevenueGrowth > 0.01 ? 'up' : dailyRevenueGrowth < -0.01 ? 'down' : 'stable',
        change: Math.round(dailyRevenueGrowth * 100),
      },
      {
        metric: 'Usage',
        direction: usageGrowth > last30Days.usage.byDay.length / 30 ? 'up' : 'stable',
        change: Math.round(((usageGrowth - (last30Days.usage.byDay.length / 30)) / (last30Days.usage.byDay.length / 30 || 1)) * 100),
      },
    ];

    return {
      projectedUsers,
      projectedRevenue,
      projectedUsage,
      confidence: 0.75, // Simplified confidence score
      trends,
    };
  }

  async getExecutiveSummary(tenantId?: string): Promise<{
    highlights: string[];
    alerts: string[];
    recommendations: string[];
    keyMetrics: Record<string, number>;
  }> {
    const metrics = await this.getDashboardMetrics(tenantId, 30);
    const predictive = await this.getPredictiveAnalytics(tenantId);

    const highlights: string[] = [];
    const alerts: string[] = [];
    const recommendations: string[] = [];

    // Generate highlights
    if (metrics.overview.activeUsers > metrics.overview.totalUsers * 0.5) {
      highlights.push(`${Math.round((metrics.overview.activeUsers / metrics.overview.totalUsers) * 100)}% user engagement rate`);
    }

    if (metrics.performance.successRate > 95) {
      highlights.push(`High system reliability at ${metrics.performance.successRate.toFixed(1)}%`);
    }

    if (metrics.overview.revenue > 0) {
      highlights.push(`$${metrics.overview.revenue.toFixed(2)} revenue generated`);
    }

    // Generate alerts
    if (metrics.performance.errorRate > 5) {
      alerts.push(`Error rate elevated at ${metrics.performance.errorRate.toFixed(1)}%`);
    }

    if (metrics.users.churnRate > 10) {
      alerts.push(`User churn rate of ${metrics.users.churnRate.toFixed(1)}% requires attention`);
    }

    if (metrics.overview.totalStorage > 1000) {
      alerts.push(`Storage utilization exceeds 1TB`);
    }

    // Generate recommendations
    if (metrics.usage.byTool.length > 0) {
      const topTool = metrics.usage.byTool.sort((a, b) => b.count - a.count)[0];
      recommendations.push(`Consider optimizing ${topTool.tool} - most used feature`);
    }

    if (predictive.trends.find(t => t.metric === 'User Growth')?.direction === 'down') {
      recommendations.push('Implement user retention campaigns');
    }

    if (metrics.users.byPlan.find(p => p.plan === 'Free')?._count > metrics.overview.totalUsers * 0.8) {
      recommendations.push('Opportunity to convert free users to paid plans');
    }

    return {
      highlights,
      alerts,
      recommendations,
      keyMetrics: {
        totalUsers: metrics.overview.totalUsers,
        activeUsers: metrics.overview.activeUsers,
        totalFiles: metrics.overview.totalFiles,
        monthlyRevenue: metrics.overview.revenue,
        successRate: metrics.performance.successRate,
        projectedGrowth: predictive.projectedUsers - metrics.overview.totalUsers,
      },
    };
  }

  async createDashboard(
    name: string,
    config: any,
    userId?: string,
    tenantId?: string,
    isDefault: boolean = false
  ) {
    return prisma.analyticsDashboards.create({
      data: {
        name,
        config,
        userId,
        tenantId,
        isDefault,
      },
    });
  }

  async getDashboards(userId?: string, tenantId?: string) {
    return prisma.analyticsDashboards.findMany({
      where: {
        OR: [
          { userId },
          { tenantId },
          { isShared: true },
        ],
      },
    });
  }

  async exportData(
    format: 'csv' | 'json' | 'xlsx',
    startDate: Date,
    endDate: Date,
    tenantId?: string
  ): Promise<Buffer> {
    const data = await prisma.analyticsEvents.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    if (format === 'json') {
      return Buffer.from(JSON.stringify(data, null, 2));
    }

    if (format === 'csv') {
      const headers = 'eventType,eventName,userId,tenantId,properties,createdAt\n';
      const rows = data.map(e => 
        `"${e.eventType}","${e.eventName}","${e.userId || ''}","${e.tenantId || ''}","${JSON.stringify(e.properties).replace(/"/g, '""')}","${e.createdAt.toISOString()}"`
      ).join('\n');
      return Buffer.from(headers + rows);
    }

    // XLSX would require additional library
    return Buffer.from('');
  }
}

export const analyticsService = new AnalyticsService();
