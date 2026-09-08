import { NextRequest, NextResponse } from 'next/server';
import { ssoService } from '@/lib/tenant/sso';
import { verifyToken } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { message: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const settings = await ssoService.getSsoSettings(tenantId);

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Get SSO settings error:', error);
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
    const { tenantId, type, config } = body;

    if (!tenantId || !type || !config) {
      return NextResponse.json(
        { message: 'Tenant ID, type, and config required' },
        { status: 400 }
      );
    }

    if (type === 'saml') {
      await ssoService.configureSaml(tenantId, config);
    } else if (type === 'oauth') {
      const { provider, ...oauthConfig } = config;
      await ssoService.configureOAuth(tenantId, provider, oauthConfig);
    } else {
      return NextResponse.json(
        { message: 'Invalid SSO type' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Configure SSO error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
