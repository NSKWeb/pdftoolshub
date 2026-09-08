import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [usageCount, dailyCount, weeklyCount, monthlyCount, files] = await Promise.all([
    prisma.usageLogs.count({ where: { userId: authUser.id } }),
    prisma.usageLogs.count({ where: { userId: authUser.id, timestamp: { gte: startOfDay } } }),
    prisma.usageLogs.count({ where: { userId: authUser.id, timestamp: { gte: startOfWeek } } }),
    prisma.usageLogs.count({ where: { userId: authUser.id, timestamp: { gte: startOfMonth } } }),
    prisma.files.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  return NextResponse.json({
    usageCount,
    dailyCount,
    weeklyCount,
    monthlyCount,
    files
  });
}
