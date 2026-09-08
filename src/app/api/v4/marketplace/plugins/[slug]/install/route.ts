import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import { installPlugin } from '@/lib/marketplace/plugins';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { tenantId, config } = body;
    
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
    
    // Check if plugin is published
    if (plugin.status !== 'published') {
      return NextResponse.json(
        { error: 'Plugin is not available for installation' },
        { status: 400 }
      );
    }
    
    // Check if already installed
    const existingInstallation = await prisma.pluginInstallations.findFirst({
      where: {
        pluginId: plugin.id,
        OR: [
          { userId: user.id },
          { tenantId: tenantId ?? undefined }
        ]
      }
    });
    
    if (existingInstallation) {
      return NextResponse.json(
        { error: 'Plugin is already installed', installation: existingInstallation },
        { status: 409 }
      );
    }
    
    // Handle paid plugins
    if (plugin.pricingModel !== 'free' && plugin.price && plugin.price > 0) {
      // In production, would process payment here
      // For now, just create transaction record
      await prisma.marketplaceTransactions.create({
        data: {
          pluginId: plugin.id,
          developerId: plugin.developerId,
          buyerId: user.id,
          amount: plugin.price,
          platformFee: plugin.price * 0.30,
          developerPayout: plugin.price * 0.70,
          transactionType: 'purchase',
          status: 'completed'
        }
      });
    }
    
    // Install plugin
    const installation = await installPlugin(
      plugin.id,
      user.id,
      tenantId,
      config
    );
    
    return NextResponse.json({ installation }, { status: 201 });
  } catch (error) {
    console.error('Error installing plugin:', error);
    return NextResponse.json(
      { error: 'Failed to install plugin' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    
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
    
    // Find and delete installation
    const installation = await prisma.pluginInstallations.findFirst({
      where: {
        pluginId: plugin.id,
        userId: user.id
      }
    });
    
    if (!installation) {
      return NextResponse.json(
        { error: 'Plugin is not installed' },
        { status: 404 }
      );
    }
    
    await prisma.pluginInstallations.delete({
      where: { id: installation.id }
    });
    
    return NextResponse.json({ message: 'Plugin uninstalled successfully' });
  } catch (error) {
    console.error('Error uninstalling plugin:', error);
    return NextResponse.json(
      { error: 'Failed to uninstall plugin' },
      { status: 500 }
    );
  }
}
