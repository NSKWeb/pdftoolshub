import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getLocalFileEntry, getLocalFilePath, isLocalStorageEnabled } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { key: string } }) {
  if (!isLocalStorageEnabled()) {
    return NextResponse.json({ message: "Downloads are unavailable" }, { status: 404 });
  }

  const entry = getLocalFileEntry(params.key);
  const filePath = entry?.path ?? getLocalFilePath(params.key);

  try {
    const fileBuffer = await fs.readFile(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": entry?.contentType ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${params.key}"`
      }
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}
