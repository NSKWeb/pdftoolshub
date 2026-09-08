import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usageLogs = await prisma.usageLogs.findMany({
    where: { userId: session.userId },
    orderBy: { timestamp: "desc" },
  });

  const ocrJobs = await prisma.ocrJobs.count({ where: { userId: session.userId } });
  const signatures = await prisma.signatures.count({ where: { userId: session.userId } });
  const batchJobs = await prisma.batchJobs.count({ where: { userId: session.userId } });

  const stats = [
    { label: "Total OCR Jobs", value: ocrJobs.toString() },
    { label: "Total Signatures", value: signatures.toString() },
    { label: "Total Batch Jobs", value: batchJobs.toString() },
    { label: "Total Usage Logs", value: usageLogs.length.toString() },
  ];

  return NextResponse.json({ stats, usageLogs });
}
