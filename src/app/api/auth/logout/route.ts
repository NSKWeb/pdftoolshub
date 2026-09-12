import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitWithRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limiter = rateLimitWithRequest(request, 30, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("token");
  return response;
}
