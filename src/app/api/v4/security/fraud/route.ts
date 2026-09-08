import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import { calculateRiskScore, getFraudStats } from '@/lib/fraud/detection';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      actionType,
      resourceType,
      resourceId,
      metadata
    } = body;
    
    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ?? 
                      request.headers.get('x-real-ip') ?? 
                      'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';
    
    const result = await calculateRiskScore({
      userId: user.id,
      tenantId: user.tenantId ?? undefined,
      actionType,
      resourceType,
      resourceId,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent,
      metadata
    });
    
    return NextResponse.json({
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      riskFactors: result.riskFactors,
      actionTaken: result.actionTaken,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate risk score' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('range') as '1h' | '24h' | '7d' | '30d') ?? '24h';
    
    const stats = await getFraudStats(timeRange);
    
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching fraud stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud stats' },
      { status: 500 }
    );
  }
}
