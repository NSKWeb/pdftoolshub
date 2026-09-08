import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const type = searchParams.get('type');

    if (user.role !== 'admin' && tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const where: {
      tenantId?: string | null;
      certificationType?: string;
    } = {};
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (type) {
      where.certificationType = type;
    }

    const certifications = await prisma.complianceCertifications.findMany({
      where,
      orderBy: { issuedDate: 'desc' }
    });

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
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
    const {
      tenantId,
      certificationType,
      standardVersion,
      issuedBy,
      issuedDate,
      expiryDate,
      certificateUrl,
      auditEvidence,
      nextAuditDate
    } = body;

    const certification = await prisma.complianceCertifications.create({
      data: {
        tenantId,
        certificationType,
        standardVersion,
        issuedBy,
        issuedDate: new Date(issuedDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        certificateUrl,
        auditEvidence: auditEvidence ?? {},
        nextAuditDate: nextAuditDate ? new Date(nextAuditDate) : null
      }
    });

    return NextResponse.json({ certification }, { status: 201 });
  } catch (error) {
    console.error('Error creating certification:', error);
    return NextResponse.json(
      { error: 'Failed to create certification' },
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
    const { certificationId, status } = body;

    const certification = await prisma.complianceCertifications.update({
      where: { id: certificationId },
      data: { status, updatedAt: new Date() }
    });

    return NextResponse.json({ certification });
  } catch (error) {
    console.error('Error updating certification:', error);
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    );
  }
}
