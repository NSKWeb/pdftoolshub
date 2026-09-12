import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";
import { processPdfTool } from "@/lib/pdf-tools";
import { uploadFile } from "@/lib/storage";
import { rateLimitWithRequest } from "@/lib/rate-limit";
import { tools } from "@/lib/tools";
import { logger, createRequestLogger } from "@/lib/logger";
import { getErrorResponse } from "@/lib/errors";
import { sanitizeFilename, validateFileType } from "@/lib/sanitize";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ tool: string }> }) {
  const requestId = randomUUID();
  const reqLogger = createRequestLogger(requestId);
  const { tool } = await params;

  reqLogger.info({ tool }, "PDF processing request started");

  try {
    const limiter = rateLimitWithRequest(request, 20, 60_000);
    if (!limiter.allowed) {
      reqLogger.warn({ tool }, "Rate limit exceeded");
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

    if (!tools.some((t) => t.slug === tool)) {
      reqLogger.warn({ tool }, "Unknown tool requested");
      return NextResponse.json(
        { message: "Unknown tool. Please select a valid PDF tool.", requestId },
        { status: 404 }
      );
    }

    const [authUser, formData] = await Promise.all([getAuthUser(), request.formData()]);
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File);
    const instructions = formData.get("instructions")?.toString() ?? null;

    if (!files.length) {
      return NextResponse.json(
        { message: "No files uploaded. Please select at least one file.", requestId },
        { status: 400 }
      );
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const maxFileSize = 50 * 1024 * 1024;

    for (const file of files) {
      const sanitizedName = sanitizeFilename(file.name);

      if (file.size > maxFileSize) {
        return NextResponse.json(
          { message: `File "${sanitizedName}" is too large. Maximum size is 50MB.`, requestId },
          { status: 413 }
        );
      }

      if (!validateFileType(file, allowedTypes)) {
        return NextResponse.json(
          { message: `File "${sanitizedName}" has unsupported type. Allowed: PDF, PNG, JPG.`, requestId },
          { status: 400 }
        );
      }
    }

    const result = await processPdfTool({ tool, files, instructions });

    reqLogger.info(
      {
        tool,
        fileSize: result.buffer.length,
        filename: result.filename
      },
      "PDF processing completed"
    );

    const key = `${authUser?.id ?? "guest"}-${Date.now()}-${result.filename}`;
    const upload = await uploadFile({
      key,
      body: result.buffer,
      contentType: result.contentType
    });

    return NextResponse.json({
      message: "Processing complete",
      downloadUrl: upload.url,
      filename: result.filename,
      requestId
    });
  } catch (error) {
    const { message, status, code } = getErrorResponse(error);
    reqLogger.error(
      {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        tool
      },
      "PDF processing failed"
    );

    return NextResponse.json({ message, code, requestId }, { status });
  }
}