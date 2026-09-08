import AWS from "aws-sdk";
import { promises as fs } from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

const s3Bucket = process.env.AWS_S3_BUCKET ?? "";
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const localDir = path.join(process.cwd(), ".uploads");
const localFiles = new Map<string, { path: string; contentType: string; expiresAt: number }>();
const cleanupWindowMs = 60 * 60 * 1000;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

if (cloudinaryCloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export type StorageProvider = "local" | "s3" | "cloudinary";

export function getStorageProvider(): StorageProvider {
  if (cloudinaryCloudName) {
    return "cloudinary";
  }
  if (s3Bucket) {
    return "s3";
  }
  return "local";
}

export function isLocalStorageEnabled() {
  return getStorageProvider() === "local";
}

export function getLocalFileEntry(key: string) {
  return localFiles.get(normalizeKey(key));
}

export function getLocalFilePath(key: string) {
  return path.join(localDir, normalizeKey(key));
}

export async function uploadFile({
  key,
  body,
  contentType
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const safeKey = normalizeKey(key);
  const provider = getStorageProvider();

  if (provider === "cloudinary") {
    const result = await cloudinary.uploader.upload(
      `data:${contentType};base64,${body.toString("base64")}`,
      {
        public_id: safeKey,
        resource_type: "auto",
        folder: "dittopdf",
        overwrite: true
      }
    );
    return { url: result.secure_url };
  }

  if (provider === "s3") {
    await s3
      .putObject({
        Bucket: s3Bucket,
        Key: safeKey,
        Body: body,
        ContentType: contentType
      })
      .promise();

    return { url: `https://${s3Bucket}.s3.amazonaws.com/${safeKey}` };
  }

  await fs.mkdir(localDir, { recursive: true });
  const filePath = path.join(localDir, safeKey);
  await fs.writeFile(filePath, body);
  localFiles.set(safeKey, {
    path: filePath,
    contentType,
    expiresAt: Date.now() + cleanupWindowMs
  });
  scheduleCleanup(safeKey);
  return { url: `/downloads/${safeKey}` };
}

function normalizeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function scheduleCleanup(key: string) {
  const entry = localFiles.get(key);
  if (!entry) {
    return;
  }
  const delay = Math.max(entry.expiresAt - Date.now(), 0);
  setTimeout(async () => {
    try {
      await fs.unlink(entry.path);
    } catch (error) {
      return;
    }
    localFiles.delete(key);
  }, delay);
}
