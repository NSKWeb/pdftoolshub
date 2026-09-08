import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  getAllActiveRegions,
  getNearestRegion,
  getRegionHealthSummary,
  createRegion,
  updateRegionStatus
} from '@/lib/global/regions';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const health = searchParams.get('health');

    if (lat && lng) {
      const region = await getNearestRegion(parseFloat(lat), parseFloat(lng));
      return NextResponse.json({ region });
    }

    if (health === 'true') {
      const summary = await getRegionHealthSummary();
      return NextResponse.json({ regions: summary });
    }

    const regions = await getAllActiveRegions();
    return NextResponse.json({ regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
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
    const region = await createRegion(body);
    
    return NextResponse.json({ region }, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: 'Failed to create region' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { regionId, status } = body;
    
    const region = await updateRegionStatus(regionId, status);
    
    return NextResponse.json({ region });
  } catch (error) {
    console.error('Error updating region:', error);
    return NextResponse.json(
      { error: 'Failed to update region' },
      { status: 500 }
    );
  }
}
