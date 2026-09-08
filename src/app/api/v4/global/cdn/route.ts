import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  getActiveEdgeNodes,
  getCDNStats,
  getOptimalEdgeNode,
  createEdgeNode
} from '@/lib/global/cdn';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stats = searchParams.get('stats');
    const regionId = searchParams.get('regionId');
    const userIp = searchParams.get('ip');

    if (stats === 'true') {
      const cdnStats = await getCDNStats();
      return NextResponse.json({ stats: cdnStats });
    }

    if (userIp) {
      const node = await getOptimalEdgeNode(userIp, regionId ?? undefined);
      return NextResponse.json({ node });
    }

    const nodes = await getActiveEdgeNodes(regionId ?? undefined);
    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Error fetching CDN data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CDN data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const node = await createEdgeNode(body);
    
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error('Error creating edge node:', error);
    return NextResponse.json(
      { error: 'Failed to create edge node' },
      { status: 500 }
    );
  }
}
