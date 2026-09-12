import { prisma } from "./prisma";

let dbAvailable: boolean | null = null;

export function isDbAvailable(): boolean {
  if (dbAvailable !== null) return dbAvailable;
  dbAvailable = Boolean(process.env.DATABASE_URL);
  return dbAvailable;
}

/**
 * Returns the Prisma client (typed) when a database is configured,
 * or null when running DB-free (gitpod/sandbox demo mode).
 */
export async function getDb() {
  if (!isDbAvailable()) {
    return null;
  }
  try {
    return prisma;
  } catch {
    return null;
  }
}

/**
 * Safely runs a DB operation when available. Returns the fallback when the
 * database is not configured or the operation fails due to an unprovisioned DB.
 */
export async function withDb<T>(fn: (db: typeof prisma) => Promise<T>, fallback: T): Promise<T> {
  const db = await getDb();
  if (!db) return fallback;
  try {
    return await fn(db);
  } catch {
    return fallback;
  }
}

export default prisma;