import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";
import { getAuthUser } from "@/lib/session";
import { rateLimitWithRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limiter = rateLimitWithRequest(request, 15, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const authUser = await getAuthUser();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ message: "File too large. Max 50MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${authUser?.id ?? "guest"}-${Date.now()}-${file.name}`;
  const upload = await uploadFile({ key, body: buffer, contentType: file.type });

  return NextResponse.json({
    message: "Uploaded",
    url: upload.url
  });
}
