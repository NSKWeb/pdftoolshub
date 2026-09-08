import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/api-keys";
import { processPdfTool } from "@/lib/pdf-tools";

/**
 * @openapi
 * /api/public/process:
 *   post:
 *     description: Process a PDF using various tools
 *     responses:
 *       200:
 *         description: Returns the processed PDF
 */
export async function POST(req: NextRequest) {
  const apiKeyHeader = req.headers.get("x-api-key");
  if (!apiKeyHeader) {
    return NextResponse.json({ error: "API key missing" }, { status: 401 });
  }

  const apiKey = await validateApiKey(apiKeyHeader);
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const formData = await req.formData();
  const tool = formData.get("tool") as string;
  const files = formData.getAll("files") as File[];
  const instructions = formData.get("instructions") as string;

  if (!tool || files.length === 0) {
    return NextResponse.json({ error: "Missing tool or files" }, { status: 400 });
  }

  try {
    const result = await processPdfTool({ tool, files, instructions });
    
    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
