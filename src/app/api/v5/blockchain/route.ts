import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileId, network } = body;

    // Simulate blockchain verification
    const transactionHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    const blockNumber = BigInt(Math.floor(Math.random() * 10000000));
    const smartContractAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

    const result = await prisma.blockchainVerification.create({
      data: {
        fileId,
        blockchainNetwork: network || 'Ethereum Mainnet',
        transactionHash,
        blockNumber,
        smartContractAddress,
        verificationStatus: 'Verified',
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedResult = {
      ...result,
      blockNumber: result.blockNumber.toString(),
    };

    return NextResponse.json({
      success: true,
      data: serializedResult,
      message: 'Blockchain verification recorded',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');

  try {
    const verifications = await prisma.blockchainVerification.findMany({
      where: fileId ? { fileId } : {},
      orderBy: { createdAt: 'desc' },
    });

    const serializedVerifications = verifications.map(v => ({
      ...v,
      blockNumber: v.blockNumber.toString(),
    }));

    return NextResponse.json({ success: true, data: serializedVerifications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
