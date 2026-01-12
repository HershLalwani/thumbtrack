import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// R2 is S3-compatible, so we use the AWS SDK
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!; // Your R2 public URL or custom domain

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * Generate a presigned URL for uploading an image directly to R2
 */
export async function generateUploadUrl(
  contentType: string,
  userId: string
): Promise<UploadUrlResult> {
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error(`Invalid content type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Generate unique key: pins/{userId}/{uuid}.{ext}
  const ext = contentType.split('/')[1];
  const key = `pins/${userId}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 10 minutes
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 600 });

  return {
    uploadUrl,
    key,
    publicUrl: `${PUBLIC_URL}/${key}`,
  };
}

/**
 * Delete an image from R2
 */
export async function deleteImage(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
  } catch (error) {
    console.error('Failed to delete image from R2:', error);
    // Don't throw - we don't want to fail pin deletion if image cleanup fails
  }
}

/**
 * Extract the key from a public URL
 */
export function getKeyFromUrl(publicUrl: string): string | null {
  if (!publicUrl.startsWith(PUBLIC_URL)) {
    return null;
  }
  return publicUrl.replace(`${PUBLIC_URL}/`, '');
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}
