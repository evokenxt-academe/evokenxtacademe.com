/**
 * R2 Upload Helpers — Cloudflare R2 via AWS S3 SDK
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

export async function generatePresignedUrl(fileName: string, fileType: string, folder: string) {
  const client = getR2Client();
  const key = `${folder}/${crypto.randomUUID()}-${fileName}`;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

export async function deleteR2Object(key: string) {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!, Key: key }));
}

export async function getR2Object(key: string): Promise<Buffer> {
  try {
    const client = getR2Client();
    const response = await client.send(new GetObjectCommand({ 
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!, 
      Key: key 
    }));

    if (!response.Body) {
      throw new Error("Empty response body from R2");
    }

    // Handle different stream types (Node.js vs Web Stream)
    const chunks: Uint8Array[] = [];
    const body = response.Body as any;

    if (body.getReader) {
      const reader = body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } else {
      for await (const chunk of body) {
        chunks.push(chunk);
      }
    }
    
    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error(`[getR2Object] Error fetching ${key}:`, error.message);
    throw error;
  }
}
