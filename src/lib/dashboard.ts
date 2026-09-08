import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

export async function getUserDashboard() {
  const user = await getAuthUser();

  if (!user) {
    return {
      stats: [
        { label: "Total tools", value: "16", helper: "Available tools" },
        { label: "Daily usage", value: "0", helper: "Sign in to track usage" },
        { label: "Weekly usage", value: "0", helper: "Sign in to track usage" },
        { label: "Monthly usage", value: "0", helper: "Sign in to track usage" },
        { label: "Plan", value: "Free", helper: "Upgrade for more" }
      ],
      recentFiles: [] as Array<{ id: string; filename: string; toolUsed: string; status: string }>
    };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [files, dailyCount, weeklyCount, monthlyCount, totalCount] = await Promise.all([
    prisma.files.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.usageLogs.count({ where: { userId: user.id, timestamp: { gte: startOfDay } } }),
    prisma.usageLogs.count({ where: { userId: user.id, timestamp: { gte: startOfWeek } } }),
    prisma.usageLogs.count({ where: { userId: user.id, timestamp: { gte: startOfMonth } } }),
    prisma.usageLogs.count({ where: { userId: user.id } })
  ]);

  return {
    stats: [
      { label: "Total tools", value: "16", helper: "Available tools" },
      { label: "Daily usage", value: dailyCount.toString(), helper: "Resets every day" },
      { label: "Weekly usage", value: weeklyCount.toString(), helper: "Last 7 days" },
      { label: "Monthly usage", value: monthlyCount.toString(), helper: "This month" },
      { label: "Plan", value: user.planType, helper: `All-time files: ${totalCount}` }
    ],
    recentFiles: files.map((file) => ({
      id: file.id,
      filename: file.originalFilename,
      toolUsed: file.toolUsed,
      status: file.status
    }))
  };
}
