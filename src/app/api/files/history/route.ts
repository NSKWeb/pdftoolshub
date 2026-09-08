import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const files = await prisma.files.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ files });
}
