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
    const { deviceId, lastSyncTimestamp, filesToUpload } = body;

    if (!deviceId) {
      return NextResponse.json(
        { message: 'Device ID required' },
        { status: 400 }
      );
    }

    // Perform sync
    const syncResult = await mobileService.syncFiles(
      userId,
      deviceId,
      lastSyncTimestamp ? new Date(lastSyncTimestamp) : undefined
    );

    // Handle file uploads if any
    if (filesToUpload && filesToUpload.length > 0) {
      for (const file of filesToUpload) {
        try {
          await mobileService.uploadFile(userId, deviceId, {
            filename: file.name,
            content: Buffer.from(file.content, 'base64'),
            metadata: file.metadata,
          });
          syncResult.uploaded++;
        } catch (error) {
          syncResult.errors.push(`Failed to upload ${file.name}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sync: syncResult,
    });
  } catch (error: any) {
    console.error('Mobile sync error:', error);
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

    // Get offline data bundle
    const offlineData = await mobileService.getOfflineData(userId);

    return NextResponse.json({
      offlineData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Get offline data error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
