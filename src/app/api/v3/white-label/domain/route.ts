import { NextRequest, NextResponse } from 'next/server';
import { whiteLabelService } from '@/lib/tenant/white-label';
import { verifyToken } from '@/lib/session';

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
    const { tenantId, domain, subdomain } = body;

    if (!tenantId || !domain) {
      return NextResponse.json(
        { message: 'Tenant ID and domain required' },
        { status: 400 }
      );
    }

    const customDomain = await whiteLabelService.addCustomDomain(
      tenantId,
      domain,
      subdomain
    );

    return NextResponse.json({
      success: true,
      domain: customDomain,
    });
  } catch (error: any) {
    console.error('Add domain error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json(
        { message: 'Domain ID required' },
        { status: 400 }
      );
    }

    const result = await whiteLabelService.verifyDomain(domainId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Verify domain error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
