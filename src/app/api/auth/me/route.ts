import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/session";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
