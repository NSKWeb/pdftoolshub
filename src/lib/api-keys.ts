import { getDb } from "./db";
import { randomBytes } from "crypto";

export async function createApiKey(userId: string, name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not configured");
  }
  const key = `dp_${randomBytes(24).toString('hex')}`;
  return db.apiKeys.create({
    data: {
      userId,
      key,
      name,
    },
  });
}

/**
 * DB-backed API key validation (used when accounts exist).
 */
export async function validateApiKey(key: string) {
  const db = await getDb();
  if (!db) return null;
  const apiKey = await db.apiKeys.findUnique({
    where: { key },
    include: { user: true },
  });
  return apiKey;
}

/**
 * Accepts a PUBLIC_API_KEY env var so the public endpoint can work
 * without a database. Falls back to DB validation otherwise.
 */
export async function validatePublicKey(key: string): Promise<boolean> {
  const publicKey = process.env.PUBLIC_API_KEY;
  if (publicKey && key === publicKey) {
    return true;
  }
  const apiKey = await validateApiKey(key);
  return Boolean(apiKey);
}
