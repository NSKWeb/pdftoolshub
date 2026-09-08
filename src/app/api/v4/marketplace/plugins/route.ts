import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  getPluginsByCategory,
  searchPlugins,
  createPlugin,
  getMarketplaceStats
} from '@/lib/marketplace/plugins';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const stats = searchParams.get('stats');
    const pricingModel = searchParams.get('pricing');
    const minRating = searchParams.get('minRating');

    if (stats === 'true') {
      const marketplaceStats = await getMarketplaceStats();
      return NextResponse.json({ stats: marketplaceStats });
    }

    if (category) {
      const plugins = await getPluginsByCategory(category);
      return NextResponse.json({ plugins });
    }

    if (query) {
      const plugins = await searchPlugins(query, {
        pricingModel: pricingModel ?? undefined,
        minRating: minRating ? parseFloat(minRating) : undefined
      });
      return NextResponse.json({ plugins });
    }

    // Default: return all published plugins
    const plugins = await searchPlugins('');
    return NextResponse.json({ plugins });
  } catch (error) {
    console.error('Error fetching plugins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
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
    
    // Add developer ID from authenticated user
    const pluginData = {
      ...body,
      developerId: user.id
    };
    
    const plugin = await createPlugin(pluginData);
    
    return NextResponse.json({ plugin }, { status: 201 });
  } catch (error) {
    console.error('Error creating plugin:', error);
    return NextResponse.json(
      { error: 'Failed to create plugin' },
      { status: 500 }
    );
  }
}
