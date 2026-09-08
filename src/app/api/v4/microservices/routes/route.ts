import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import {
  createRoute,
  getAllActiveRoutes,
  getRoute,
  getRouteMetrics,
  getCircuitBreakerStatus,
  updateRouteStatus,
  deleteRoute
} from '@/lib/microservices/gateway';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const method = searchParams.get('method');
    const routeId = searchParams.get('routeId');
    const metrics = searchParams.get('metrics');
    const circuitBreaker = searchParams.get('circuitBreaker');

    if (routeId && metrics === 'true') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const timeRange = (searchParams.get('timeRange') as '1h' | '24h' | '7d') ?? '24h';
      const routeMetrics = await getRouteMetrics(routeId, timeRange);
      return NextResponse.json({ metrics: routeMetrics });
    }

    if (routeId && circuitBreaker === 'true') {
      if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const status = await getCircuitBreakerStatus(routeId);
      return NextResponse.json({ circuitBreaker: status });
    }

    if (path && method) {
      const route = await getRoute(path, method);
      return NextResponse.json({ route });
    }

    const routes = await getAllActiveRoutes();
    return NextResponse.json({ routes });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routes' },
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
    const route = await createRoute(body);
    
    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { error: 'Failed to create route' },
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
    const { routeId, isActive } = body;
    
    const route = await updateRouteStatus(routeId, isActive);
    
    return NextResponse.json({ route });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json(
      { error: 'Failed to update route' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    
    if (!routeId) {
      return NextResponse.json(
        { error: 'Missing routeId' },
        { status: 400 }
      );
    }
    
    await deleteRoute(routeId);
    
    return NextResponse.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json(
      { error: 'Failed to delete route' },
      { status: 500 }
    );
  }
}
