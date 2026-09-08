import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/session";
import { addBatchJob } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobType, payload } = await req.json();

  if (!jobType || !payload) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const job = await addBatchJob(session.userId, jobType, payload);

  return NextResponse.json(job);
}

export async function GET(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.batchJobs.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(jobs);
}
