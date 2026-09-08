import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/session";
import { signPdf } from "@/lib/signatures";

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const certificate = formData.get("certificate") as File;

  if (!file || !certificate) {
    return NextResponse.json({ error: "Missing file or certificate" }, { status: 400 });
  }

  try {
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const certBuffer = Buffer.from(await certificate.arrayBuffer());
    
    const signedBuffer = await signPdf(pdfBuffer, certBuffer);
    
    // In a real app, we would upload this and save the record
    const signature = await prisma.signatures.create({
      data: {
        userId: session.userId,
        fileId: "signed_" + file.name,
        signatureData: "Digitally signed",
        status: "valid",
      },
    });

    return new NextResponse(signedBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="signed-${file.name}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signatures = await prisma.signatures.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(signatures);
}
