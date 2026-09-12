import { NextRequest, NextResponse } from "next/server";
import { validatePublicKey } from "@/lib/api-keys";
import { processPdfTool } from "@/lib/pdf-tools";
import { getErrorResponse } from "@/lib/errors";
import { rateLimitWithRequest } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit by client IP — 10 requests/min per IP for the public API.
  const limiter = rateLimitWithRequest(req, 10, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const apiKeyHeader = req.headers.get("x-api-key");
  if (!apiKeyHeader) {
    return NextResponse.json({ error: "API key missing" }, { status: 401 });
  }

  const isValid = await validatePublicKey(apiKeyHeader);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const formData = await req.formData();
  const tool = formData.get("tool") as string;
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  const instructions = (formData.get("instructions") as string) ?? null;

  if (!tool || files.length === 0) {
    return NextResponse.json({ error: "Missing tool or files" }, { status: 400 });
  }

  try {
    const result = await processPdfTool({ tool, files, instructions });

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`
      }
    });
  } catch (error) {
    const { message, status } = getErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}