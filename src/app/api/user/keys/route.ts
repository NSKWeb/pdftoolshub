import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { createApiKey } from "@/lib/api-keys";

export async function POST(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  const apiKey = await createApiKey(session.userId, name || "My API Key");

  return NextResponse.json(apiKey);
}

export async function GET(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKeys.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(keys);
}

export async function DELETE(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await prisma.apiKeys.delete({
    where: { id, userId: session.userId },
  });

  return NextResponse.json({ success: true });
}
