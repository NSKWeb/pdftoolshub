import { prisma } from "./prisma";
import { randomBytes } from "crypto";

export async function createApiKey(userId: string, name: string) {
  const key = `dp_${randomBytes(24).toString('hex')}`;
  return prisma.apiKeys.create({
    data: {
      userId,
      key,
      name,
    },
  });
}

export async function validateApiKey(key: string) {
  const apiKey = await prisma.apiKeys.findUnique({
    where: { key },
    include: { user: true },
  });
  return apiKey;
}
