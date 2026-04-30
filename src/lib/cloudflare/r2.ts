import { Client as MinioClient } from "minio";

export type R2Folder =
  | "course-thumbnails"
  | "course-resources"
  | "avatars"
  | "certificates"
  | "question-bank-images";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing required env var: ${names.join(" or ")}`);
}

function getR2Config(): R2Config {
  return {
    accountId: requireEnv("CLOUDFLARE_R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("CLOUDFLARE_R2_BUCKET_NAME", "CLOUDFLARE_R2_BUCKET"),
    publicBaseUrl: requireEnv(
      "CLOUDFLARE_R2_PUBLIC_URL",
      "CLOUDFLARE_R2_PUBLIC_BASE_URL"
    ).replace(/\/+$/, ""),
  };
}

let cachedClient: MinioClient | null = null;

function getR2Client(config: R2Config): MinioClient {
  if (cachedClient) return cachedClient;

  cachedClient = new MinioClient({
    endPoint: `${config.accountId}.r2.cloudflarestorage.com`,
    port: 443,
    useSSL: true,
    accessKey: config.accessKeyId,
    secretKey: config.secretAccessKey,
    region: "auto",
  });

  return cachedClient;
}

function sanitizeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function generateFilePath(folder: R2Folder | string, filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() || "bin";
  const baseName = filename.replace(/\.[^.]+$/, "");
  const safeBaseName = sanitizeSegment(baseName) || "file";

  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeBaseName}.${sanitizeSegment(extension) || "bin"}`;
}

export function buildR2ObjectKey(params: {
  folder: string;
  userId: string;
  title: string;
  ext: string;
}): string {
  const safeTitle = sanitizeSegment(params.title) || "file";
  const cleanExt = params.ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `${params.folder}/${params.userId}/${Date.now()}-${crypto.randomUUID()}-${safeTitle}.${cleanExt}`;
}

export async function createPresignedUploadUrl(params: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const config = getR2Config();
  const client = getR2Client(config);

  return client.presignedPutObject(
    config.bucket,
    params.key,
    params.expiresInSeconds ?? 3600,
  );
}

export function getR2PublicUrl(key: string): string {
  const config = getR2Config();
  return `${config.publicBaseUrl}/${key}`;
}

export async function uploadBufferToR2(params: {
  key: string;
  body: ArrayBuffer;
  contentType: string;
}): Promise<{ publicUrl: string; key: string }> {
  const config = getR2Config();
  const client = getR2Client(config);

  const buffer = Buffer.from(params.body);
  await client.putObject(config.bucket, params.key, buffer, buffer.length, {
    "Content-Type": params.contentType,
  });

  return {
    key: params.key,
    publicUrl: getR2PublicUrl(params.key),
  };
}
