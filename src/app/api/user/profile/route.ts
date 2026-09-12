import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/session";
import { rateLimitWithRequest } from "@/lib/rate-limit";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({
      id: authUser.id,
      email: authUser.email,
      planType: authUser.planType,
      usageCount: 0
    });
  }

  const user = await db.users.findUnique({ where: { id: authUser.id } });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    planType: user.planType,
    usageCount: user.usageCount
  });
}

export async function PATCH(request: Request) {
  const limiter = rateLimitWithRequest(request, 10, 60_000);
  if (!limiter.allowed) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { planType } = await request.json();
  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { message: "Profiles are read-only without a database." },
      { status: 503 }
    );
  }
  const user = await db.users.update({
    where: { id: authUser.id },
    data: { planType: planType ?? authUser.planType }
  });

  return NextResponse.json({
    message: "Profile updated",
    user: { id: user.id, email: user.email, planType: user.planType }
  });
}
