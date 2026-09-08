import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getClientId } from "@/lib/request";
import { signToken } from "@/lib/session";

export async function POST(request: Request) {
  const limiter = rateLimit(getClientId(), 5, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.users.create({
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
