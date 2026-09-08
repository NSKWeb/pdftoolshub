import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const { name, subdomain, branding } = body;

    if (!name || !subdomain) {
      return NextResponse.json(
        { message: 'Name and subdomain required' },
        { status: 400 }
      );
    }

    // Check if subdomain is available
    const existing = await prisma.tenants.findUnique({
      where: { subdomain },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Subdomain already taken' },
        { status: 409 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    // Create tenant
    const tenant = await whiteLabelService.createTenant(
      name,
      subdomain,
      user?.email || '',
      branding
    );

    // Update user with tenant
    await prisma.users.update({
      where: { id: userId },
      data: {
        tenantId: tenant.id,
        planType: 'Enterprise',
      },
    });

    // Assign admin role
    const adminRole = await prisma.tenantRoles.findFirst({
      where: { tenantId: tenant.id, name: 'Admin' },
    });

    if (adminRole) {
      await prisma.userTenantRoles.create({
        data: {
          userId,
          tenantId: tenant.id,
          roleId: adminRole.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        createdAt: tenant.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create tenant error:', error);
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

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
      },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ tenant: null });
    }

    const stats = await whiteLabelService.getTenantStats(user.tenantId);

    return NextResponse.json({
      tenant: user.tenant,
      stats,
    });
  } catch (error: any) {
    console.error('Get tenant error:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
