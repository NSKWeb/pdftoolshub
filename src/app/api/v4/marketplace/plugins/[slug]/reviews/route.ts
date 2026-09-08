import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import { addPluginReview } from '@/lib/marketplace/plugins';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    const plugin = await prisma.marketplacePlugins.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ reviews: plugin.reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { rating, review } = body;
    
    // Get plugin
    const plugin = await prisma.marketplacePlugins.findUnique({
      where: { slug }
    });
    
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }
    
    // Check if user has installed the plugin (for verified reviews)
    const installation = await prisma.pluginInstallations.findFirst({
      where: {
        pluginId: plugin.id,
        userId: user.id
      }
    });
    
    const reviewRecord = await addPluginReview(
      plugin.id,
      user.id,
      rating,
      review
    );
    
    // Mark as verified if installed
    if (installation) {
      await prisma.pluginReviews.update({
        where: { id: reviewRecord.id },
        data: { isVerified: true }
      });
    }
    
    return NextResponse.json({ review: reviewRecord }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
