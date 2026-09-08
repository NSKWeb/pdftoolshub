import { NextRequest, NextResponse } from 'next/server';
import { mobileService } from '@/lib/mobile/service';
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
    const { deviceId, platform, appVersion, pushToken, deviceModel, osVersion } = body;

    if (!deviceId || !platform || !appVersion) {
      return NextResponse.json(
        { message: 'Device ID, platform, and app version required' },
        { status: 400 }
      );
    }

    const device = await mobileService.registerDevice(userId, {
      deviceId,
      platform,
      appVersion,
      pushToken,
      deviceModel,
      osVersion,
    });

    return NextResponse.json({
      success: true,
      device,
    });
  } catch (error: any) {
    console.error('Register device error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

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

    const devices = await mobileService.getUserDevices(userId);
    const stats = await mobileService.getMobileStats(userId);

    return NextResponse.json({ devices, stats });
  } catch (error: any) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { message: 'Device ID required' },
        { status: 400 }
      );
    }

    await mobileService.unregisterDevice(userId, deviceId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unregister device error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
