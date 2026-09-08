import { NextRequest, NextResponse } from 'next/server';
import { whiteLabelService } from '@/lib/tenant/white-label';
import { verifyToken } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const subdomain = searchParams.get('subdomain');

    const branding = await whiteLabelService.getBranding(
      tenantId || undefined,
      subdomain || undefined
    );

    return NextResponse.json({ branding });
  } catch (error: any) {
    console.error('Get branding error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, branding } = body;

    if (!tenantId || !branding) {
      return NextResponse.json(
        { message: 'Tenant ID and branding required' },
        { status: 400 }
      );
    }

    const updated = await whiteLabelService.updateBranding(tenantId, branding);

    return NextResponse.json({
      success: true,
      branding: updated.branding,
    });
  } catch (error: any) {
    console.error('Update branding error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
