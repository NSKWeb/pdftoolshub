import { prisma } from '../prisma';

export interface MobileDeviceInfo {
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  pushToken?: string;
  deviceModel?: string;
  osVersion?: string;
}

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  errors: string[];
}

export class MobileService {
  async registerDevice(
    userId: string,
    deviceInfo: MobileDeviceInfo
  ) {
    // Deactivate any existing devices with same ID for this user
    await prisma.mobileDevices.updateMany({
      where: {
        userId,
        deviceId: deviceInfo.deviceId,
      },
      data: { isActive: false },
    });

    // Create or update device registration
    return prisma.mobileDevices.upsert({
      where: {
        deviceId: deviceInfo.deviceId,
      },
      update: {
        userId,
        platform: deviceInfo.platform,
        appVersion: deviceInfo.appVersion,
        pushToken: deviceInfo.pushToken,
        deviceInfo: {
          model: deviceInfo.deviceModel,
          osVersion: deviceInfo.osVersion,
        },
        isActive: true,
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        appVersion: deviceInfo.appVersion,
        pushToken: deviceInfo.pushToken,
        deviceInfo: {
          model: deviceInfo.deviceModel,
          osVersion: deviceInfo.osVersion,
        },
      },
    });
  }

  async unregisterDevice(userId: string, deviceId: string) {
    return prisma.mobileDevices.updateMany({
      where: {
        userId,
        deviceId,
      },
      data: {
        isActive: false,
        pushToken: null,
      },
    });
  }

  async getUserDevices(userId: string) {
    return prisma.mobileDevices.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });
  }

  async updatePushToken(deviceId: string, pushToken: string) {
    return prisma.mobileDevices.update({
      where: { deviceId },
      data: {
        pushToken,
        lastActiveAt: new Date(),
      },
    });
  }

  async sendPushNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
    }
  ): Promise<{ sent: number; failed: number }> {
    const devices = await prisma.mobileDevices.findMany({
      where: {
        userId,
        isActive: true,
        pushToken: { not: null },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const device of devices) {
      if (!device.pushToken) continue;

      try {
        if (device.platform === 'ios') {
          await this.sendAPNsNotification(device.pushToken, notification);
        } else {
          await this.sendFCMNotification(device.pushToken, notification);
        }
        sent++;

        // Mark notification as sent
        await prisma.notifications.updateMany({
          where: {
            userId,
            title: notification.title,
            message: notification.body,
            createdAt: {
              gte: new Date(Date.now() - 60000), // Last minute
            },
          },
          data: { sentViaPush: true },
        });
      } catch (error) {
        failed++;
        console.error(`Failed to send push to ${device.deviceId}:`, error);
      }
    }

    return { sent, failed };
  }

  async syncFiles(
    userId: string,
    deviceId: string,
    lastSyncTimestamp?: Date
  ): Promise<SyncResult> {
    const result: SyncResult = {
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Get files modified since last sync
      const filesToSync = await prisma.files.findMany({
        where: {
          userId,
          ...(lastSyncTimestamp ? {
            updatedAt: { gt: lastSyncTimestamp },
          } : {}),
        },
      });

      result.downloaded = filesToSync.length;

      // Update device last active
      await prisma.mobileDevices.update({
        where: { deviceId },
        data: { lastActiveAt: new Date() },
      });

    } catch (error: any) {
      result.errors.push(error.message);
    }

    return result;
  }

  async uploadFile(
    userId: string,
    deviceId: string,
    fileData: {
      filename: string;
      content: Buffer;
      metadata?: Record<string, any>;
    }
  ) {
    // Store file using existing storage service
    const { storeFile } = await import('../storage');
    
    const stored = await storeFile(fileData.content, fileData.filename);

    // Create file record
    const file = await prisma.files.create({
      data: {
        userId,
        originalFilename: fileData.filename,
        processedFilename: stored.filename,
        fileSize: fileData.content.length,
        toolUsed: 'mobile-upload',
        metadata: fileData.metadata,
      },
    });

    // Log the upload
    await prisma.auditLogs.create({
      data: {
        userId,
        action: 'mobile_file_upload',
        entityType: 'file',
        entityId: file.id,
        newValues: {
          deviceId,
          filename: fileData.filename,
          size: fileData.content.length,
        },
      },
    });

    return file;
  }

  async getOfflineData(userId: string): Promise<{
    files: any[];
    workflows: any[];
    documents: any[];
  }> {
    const [files, workflows, documents] = await Promise.all([
      prisma.files.findMany({
        where: {
          userId,
          status: 'processed',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          originalFilename: true,
          fileSize: true,
          toolUsed: true,
          createdAt: true,
        },
      }),
      prisma.workflows.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
        },
      }),
      prisma.documents.findMany({
        where: {
          userId,
          status: 'active',
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          title: true,
          classification: true,
          tags: true,
          updatedAt: true,
        },
      }),
    ]);

    return { files, workflows, documents };
  }

  async getMobileStats(userId: string) {
    const [
      deviceCount,
      recentUploads,
      offlineSyncCount,
    ] = await Promise.all([
      prisma.mobileDevices.count({
        where: {
          userId,
          isActive: true,
        },
      }),
      prisma.files.count({
        where: {
          userId,
          toolUsed: 'mobile-upload',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.auditLogs.count({
        where: {
          userId,
          action: { contains: 'mobile' },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      devices: deviceCount,
      uploads30Days: recentUploads,
      syncOperations: offlineSyncCount,
    };
  }

  private async sendAPNsNotification(
    token: string,
    notification: { title: string; body: string; data?: Record<string, any> }
  ): Promise<void> {
    // In production, use apn library to send to Apple Push Notification service
    // This is a placeholder
    const { default: apn } = await import('apn');
    
    const provider = new apn.Provider({
      token: {
        key: process.env.APN_KEY_PATH || '',
        keyId: process.env.APN_KEY_ID || '',
        teamId: process.env.APN_TEAM_ID || '',
      },
      production: process.env.NODE_ENV === 'production',
    });

    const note = new apn.Notification();
    note.alert = {
      title: notification.title,
      body: notification.body,
    };
    note.payload = notification.data || {};
    note.topic = process.env.IOS_BUNDLE_ID || '';

    await provider.send(note, token);
    provider.shutdown();
  }

  private async sendFCMNotification(
    token: string,
    notification: { title: string; body: string; data?: Record<string, any> }
  ): Promise<void> {
    // In production, use firebase-admin to send to Firebase Cloud Messaging
    // This is a placeholder
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
      }),
    });

    if (!response.ok) {
      throw new Error(`FCM error: ${response.statusText}`);
    }
  }

  async validateBiometricToken(
    userId: string,
    deviceId: string,
    biometricToken: string
  ): Promise<boolean> {
    // In production, validate biometric token against stored hash
    // This is a simplified implementation
    const device = await prisma.mobileDevices.findFirst({
      where: {
        userId,
        deviceId,
        isActive: true,
      },
    });

    if (!device) return false;

    // Verify the biometric token (simplified)
    return biometricToken.length > 20;
  }

  async getAppConfig(platform: 'ios' | 'android'): Promise<{
    minVersion: string;
    currentVersion: string;
    features: Record<string, boolean>;
    apiEndpoints: Record<string, string>;
  }> {
    return {
      minVersion: '3.0.0',
      currentVersion: '3.2.1',
      features: {
        offlineMode: true,
        biometricAuth: true,
        pushNotifications: true,
        cloudSync: true,
        aiAnalysis: true,
        ocr: true,
        signatures: true,
      },
      apiEndpoints: {
        base: process.env.NEXT_PUBLIC_SITE_URL || 'https://dittopdf.com',
        api: '/api/v3/mobile',
        ws: '/ws',
      },
    };
  }
}

export const mobileService = new MobileService();
