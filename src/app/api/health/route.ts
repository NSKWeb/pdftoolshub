import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDbAvailable } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimitWithRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database?: { status: "ok" | "skipped" | "error"; responseTime: number; message?: string };
    memory: { status: "ok" | "warning" | "error"; usage: number; message?: string };
    storage: { status: "ok" | "error"; message?: string };
  };
}

export async function GET(request: NextRequest) {
  const limiter = rateLimitWithRequest(request, 60, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  }

  const checks: HealthCheck["checks"] = {
    memory: { status: "ok", usage: 0 },
    storage: { status: "ok" }
  };

  // Optional DB check — database is not required for core functionality.
  if (isDbAvailable()) {
    const dbStart = Date.now();
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok", responseTime: Date.now() - dbStart };
    } catch (error) {
      checks.database = {
        status: "error",
        responseTime: Date.now() - dbStart,
        message: error instanceof Error ? error.message : "Database connection failed"
      };
      logger.error("Health check: Database error", { error });
    }
  } else {
    checks.database = { status: "skipped", responseTime: 0 };
  }

  const memUsage = process.memoryUsage();
  checks.memory.usage = Math.round(memUsage.heapUsed / 1024 / 1024);
  if (checks.memory.usage > 1024) {
    checks.memory.status = "error";
    checks.memory.message = "High memory usage detected";
  } else if (checks.memory.usage > 512) {
    checks.memory.status = "warning";
  }

  // Verify storage writes are possible.
  try {
    const { promises: fs } = await import("fs");
    const { default: path } = await import("path");
    const dir = path.join(process.cwd(), ".uploads");
    await fs.access(dir).catch(async () => fs.mkdir(dir, { recursive: true }));
  } catch (error) {
    checks.storage.status = "error";
    checks.storage.message = error instanceof Error ? error.message : "Storage unavailable";
  }

  const values = Object.values(checks);
  const hasError = values.some((c) => c.status === "error");
  const hasWarning = values.some((c) => c.status === "warning");
  const status = hasError ? "unhealthy" : hasWarning ? "degraded" : "healthy";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      checks
    },
    {
      status: status === "unhealthy" ? 503 : 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
    }
  );
}