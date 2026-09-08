import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performOcr } from "@/lib/ocr";
import { getUserSession } from "@/lib/session";
import { uploadFile } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Create OCR job
  const job = await prisma.ocrJobs.create({
    data: {
      userId: session.userId,
      fileId: "pending", // Will update after upload if needed
      status: "processing",
    },
  });

  try {
    const text = await performOcr(buffer);
    
    await prisma.ocrJobs.update({
      where: { id: job.id },
      data: {
        status: "completed",
        result: text,
      },
    });

    return NextResponse.json({ jobId: job.id, text });
  } catch (error: any) {
    await prisma.ocrJobs.update({
      where: { id: job.id },
      data: {
        status: "failed",
        result: error.message,
      },
    });
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.ocrJobs.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}
