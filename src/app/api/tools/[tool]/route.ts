import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";
import { processPdfTool, PDFProcessingError } from "@/lib/pdf-tools";
import { uploadFile } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import { getClientId } from "@/lib/request";
import { tools } from "@/lib/tools";
import { logger, createRequestLogger } from "@/lib/logger";
import { getErrorResponse } from "@/lib/errors";
import { sanitizeFilename, validateFileType } from "@/lib/sanitize";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: { tool: string } }) {
  const requestId = randomUUID();
  const reqLogger = createRequestLogger(requestId);
  
  reqLogger.info({ tool: params.tool }, "PDF processing request started");
  
  try {
    const limiter = rateLimit(getClientId(request), 20, 60_000);
    if (!limiter.allowed) {
      reqLogger.warn({ tool: params.tool }, "Rate limit exceeded");
      return NextResponse.json(
        { message: "Too many requests. Please try again later.", requestId },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + 60)
          }
        }
      );
    }

    if (!tools.some((tool) => tool.slug === params.tool)) {
      reqLogger.warn({ tool: params.tool }, "Unknown tool requested");
      return NextResponse.json(
        { message: "Unknown tool. Please select a valid PDF tool.", requestId },
        { status: 404 }
      );
    }

    const authUser = await getAuthUser();
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const instructions = formData.get("instructions")?.toString() ?? null;

    if (!files.length) {
      return NextResponse.json(
        { message: "No files uploaded. Please select at least one file.", requestId },
        { status: 400 }
      );
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const maxFileSize = 25 * 1024 * 1024;
    const absoluteMaxSize = 100 * 1024 * 1024;

    for (const file of files) {
      const sanitizedName = sanitizeFilename(file.name);
      
      if (file.size > absoluteMaxSize) {
        return NextResponse.json(
          { message: "File size exceeds maximum allowed (100MB)", requestId },
          { status: 413 }
        );
      }
      
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { message: `File "${sanitizedName}" is too large. Maximum size is 25MB.`, requestId },
          { status: 400 }
        );
      }
      
      if (!validateFileType(file, allowedTypes)) {
        return NextResponse.json(
          { message: `File "${sanitizedName}" has unsupported type. Allowed: PDF, PNG, JPG.`, requestId },
          { status: 400 }
        );
      }
    }

    const userRecord = authUser ? await prisma.users.findUnique({ where: { id: authUser.id } }) : null;
    const now = new Date();
    const shouldReset = userRecord
      ? now.getTime() - userRecord.lastResetDate.getTime() >= 24 * 60 * 60 * 1000
      : false;
    const dailyUsage = userRecord ? (shouldReset ? 0 : userRecord.usageCount) : 0;

    if (userRecord?.planType === "Free" && dailyUsage >= 5) {
      return NextResponse.json(
        {
          message: "Daily limit reached (5 files). Upgrade to Pro for unlimited processing.",
          upgradeUrl: "/dashboard",
          requestId
        },
        { status: 403 }
      );
    }

    const result = await processPdfTool({ tool: params.tool, files, instructions });
    
    reqLogger.info({ 
      tool: params.tool, 
      fileSize: result.buffer.length,
      filename: result.filename 
    }, "PDF processing completed");
    
    const key = `${authUser?.id ?? "guest"}-${Date.now()}-${result.filename}`;
    const upload = await uploadFile({
      key,
      body: result.buffer,
      contentType: result.contentType
    });

    if (authUser && userRecord) {
      await prisma.$transaction([
        prisma.files.create({
          data: {
            userId: authUser.id,
            originalFilename: files[0].name,
            processedFilename: result.filename,
            fileSize: result.buffer.length,
            toolUsed: params.tool,
            status: "processed"
          }
        }),
        prisma.usageLogs.create({
          data: {
            userId: authUser.id,
            toolUsed: params.tool,
            fileSize: result.buffer.length
          }
        }),
        prisma.users.update({
          where: { id: authUser.id },
          data: shouldReset
            ? { usageCount: 1, lastResetDate: now }
            : { usageCount: { increment: 1 } }
        })
      ]);
    }

    return NextResponse.json({
      message: "Processing complete",
      downloadUrl: upload.url,
      filename: result.filename,
      requestId
    });
  } catch (error) {
    const { message, status, code } = getErrorResponse(error);
    reqLogger.error({ error: error instanceof Error ? error.message : error, tool: params.tool }, "PDF processing failed");
    
    return NextResponse.json(
      { message, code, requestId },
      { status }
    );
  }
}
