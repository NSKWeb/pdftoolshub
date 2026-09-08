import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  email: string;
  planType: string;
};

const jwtSecret = process.env.JWT_SECRET ?? "dev_secret";

export function signToken(payload: AuthUser) {
  return jwt.sign(payload, jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtSecret) as AuthUser;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const headerList = headers();
  const auth = headerList.get("authorization");
  const cookieToken = cookies().get("token")?.value;
  const token = auth?.startsWith("Bearer ") ? auth.replace("Bearer ", "") : cookieToken;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}
