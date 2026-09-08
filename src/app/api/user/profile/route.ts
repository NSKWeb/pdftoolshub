import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/session";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({ where: { id: authUser.id } });
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
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { planType } = await request.json();
  const user = await prisma.users.update({
    where: { id: authUser.id },
    data: { planType: planType ?? authUser.planType }
  });

  return NextResponse.json({
    message: "Profile updated",
    user: { id: user.id, email: user.email, planType: user.planType }
  });
}
