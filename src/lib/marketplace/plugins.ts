import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export interface PluginConfig {
  developerId: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  version: string;
  category: string;
  pricingModel: 'free' | 'onetime' | 'subscription' | 'usage';
  price?: number;
  revenueShare?: number;
  iconUrl?: string;
  screenshots?: string[];
  documentationUrl?: string;
  repositoryUrl?: string;
  manifest?: Record<string, unknown>;
  configSchema?: Record<string, unknown>;
  permissions?: string[];
}

export async function createPlugin(config: PluginConfig) {
  return await prisma.marketplacePlugins.create({
    data: {
      developerId: config.developerId,
      name: config.name,
      slug: config.slug,
      description: config.description,
      shortDescription: config.shortDescription,
      version: config.version,
      category: config.category,
      pricingModel: config.pricingModel,
      price: config.price,
      revenueShare: config.revenueShare ?? 0.70,
      status: 'pending',
      downloadCount: 0,
      rating: 0,
      reviewCount: 0,
      iconUrl: config.iconUrl,
      screenshots: config.screenshots ?? [],
      documentationUrl: config.documentationUrl,
      repositoryUrl: config.repositoryUrl,
      manifest: config.manifest ?? {},
      configSchema: config.configSchema ?? {},
      permissions: config.permissions ?? []
    }
  });
}

export async function getPluginBySlug(slug: string) {
  return await prisma.marketplacePlugins.findUnique({
    where: { slug },
    include: {
      reviews: {
        include: {
          user: {
            select: { id: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      installations: true
    }
  });
}

export async function getPluginsByCategory(category: string) {
  return await prisma.marketplacePlugins.findMany({
    where: {
      category,
      status: 'published'
    },
    orderBy: [
      { rating: 'desc' },
      { downloadCount: 'desc' }
    ]
  });
}

export async function searchPlugins(query: string, filters?: {
  category?: string;
  pricingModel?: string;
  minRating?: number;
}) {
  const where: {
    status: string;
    OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
    category?: string;
    pricingModel?: string;
    rating?: { gte: number };
  } = { status: 'published' };
  
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
  }
  
  if (filters?.category) {
    where.category = filters.category;
  }
  
  if (filters?.pricingModel) {
    where.pricingModel = filters.pricingModel;
  }
  
  if (filters?.minRating) {
    where.rating = { gte: filters.minRating };
  }
  
  return await prisma.marketplacePlugins.findMany({
    where,
    orderBy: [
      { rating: 'desc' },
      { downloadCount: 'desc' }
    ]
  });
}

export async function installPlugin(
  pluginId: string,
  userId?: string,
  tenantId?: string,
  config?: Record<string, unknown>
) {
  await prisma.marketplacePlugins.update({
    where: { id: pluginId },
    data: { downloadCount: { increment: 1 } }
  });
  
  return await prisma.pluginInstallations.create({
    data: {
      pluginId,
      userId,
      tenantId,
      config: config ?? {},
      status: 'active'
    }
  });
}

export async function addPluginReview(
  pluginId: string,
  userId: string,
  rating: number,
  review?: string
) {
  const result = await prisma.pluginReviews.create({
    data: {
      pluginId,
      userId,
      rating,
      review,
      isVerified: false
    }
  });
  
  // Update plugin rating
  const reviews = await prisma.pluginReviews.findMany({
    where: { pluginId }
  });
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  await prisma.marketplacePlugins.update({
    where: { id: pluginId },
    data: {
      rating: Math.round(avgRating * 100) / 100,
      reviewCount: reviews.length
    }
  });
  
  return result;
}

export async function updatePluginStatus(
  pluginId: string,
  status: 'pending' | 'published' | 'rejected' | 'suspended'
) {
  return await prisma.marketplacePlugins.update({
    where: { id: pluginId },
    data: { status, updatedAt: new Date() }
  });
}

export async function getDeveloperPlugins(developerId: string) {
  return await prisma.marketplacePlugins.findMany({
    where: { developerId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getMarketplaceStats() {
  const [
    totalPlugins,
    totalInstallations,
    totalDevelopers,
    totalRevenue
  ] = await Promise.all([
    prisma.marketplacePlugins.count({ where: { status: 'published' } }),
    prisma.pluginInstallations.count(),
    prisma.marketplaceDevelopers.count(),
    prisma.marketplaceTransactions.aggregate({
      _sum: { amount: true }
    })
  ]);
  
  return {
    totalPlugins,
    totalInstallations,
    totalDevelopers,
    totalRevenue: totalRevenue._sum.amount ?? 0
  };
}

export async function createTransaction(
  pluginId: string,
  developerId: string,
  buyerId: string,
  amount: number,
  transactionType: string
) {
  const platformFee = amount * 0.30; // 30% platform fee
  const developerPayout = amount - platformFee;
  
  return await prisma.marketplaceTransactions.create({
    data: {
      pluginId,
      developerId,
      buyerId,
      amount,
      platformFee,
      developerPayout,
      transactionType,
      status: 'pending'
    }
  });
}
