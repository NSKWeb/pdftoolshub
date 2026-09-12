import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDb } from "@/lib/db";
import { rateLimitWithRequest } from "@/lib/rate-limit";
import { signToken } from "@/lib/session";

export async function POST(request: Request) {
  const limiter = rateLimitWithRequest(request, 5, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { message: "Registration is disabled. Set a DATABASE_URL to enable accounts." },
      { status: 503 }
    );
  }

  const existing = await db.users.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.users.create({
    data: { email, passwordHash }
  });

  const token = signToken({ id: user.id, email: user.email, planType: user.planType });

  const response = NextResponse.json({
    message: "Account created",
    token,
    user: { id: user.id, email: user.email, planType: user.planType }
  });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });
  return response;
}
