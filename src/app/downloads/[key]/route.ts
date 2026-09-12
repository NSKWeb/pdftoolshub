import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getLocalFileEntry, getLocalFilePath, isLocalStorageEnabled } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  if (!isLocalStorageEnabled()) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const entry = getLocalFileEntry(key);
  const filePath = getLocalFilePath(key);

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": entry?.contentType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(key)}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ message: "File not found or expired" }, { status: 404 });
  }
}