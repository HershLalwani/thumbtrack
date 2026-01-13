import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

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

// Allowed image types for input
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// WebP conversion settings
const WEBP_QUALITY = 85; // Good balance of quality and size
const MAX_WIDTH = 2048; // Max width for pins
const MAX_HEIGHT = 4096; // Max height for pins (tall images like Pinterest)

interface UploadUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

interface UploadResult {
  key: string;
  publicUrl: string;
  originalSize: number;
  convertedSize: number;
  width: number;
  height: number;
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

/**
 * Validate that the content type is an allowed image type
 */
export function isValidImageType(contentType: string): boolean {
  return ALLOWED_TYPES.includes(contentType);
}

/**
 * Convert image to WebP and upload to R2
 * @param buffer - The original image buffer
 * @param userId - The user ID for organizing uploads
 * @param originalContentType - The original content type
 * @returns Upload result with URLs and size info
 */
export async function convertAndUploadImage(
  buffer: Buffer,
  userId: string,
  originalContentType: string
): Promise<UploadResult> {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured');
  }

  if (!isValidImageType(originalContentType)) {
    throw new Error(`Invalid content type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  }

  const originalSize = buffer.length;

  // Process image with sharp
  let sharpInstance = sharp(buffer);
  
  // Get original metadata
  const metadata = await sharpInstance.metadata();
  
  // Handle animated GIFs - keep as WebP animation
  const isAnimated = metadata.pages && metadata.pages > 1;
  
  // Resize if needed (maintain aspect ratio)
  if (metadata.width && metadata.width > MAX_WIDTH) {
    sharpInstance = sharpInstance.resize(MAX_WIDTH, undefined, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }
  if (metadata.height && metadata.height > MAX_HEIGHT) {
    sharpInstance = sharpInstance.resize(undefined, MAX_HEIGHT, {
      withoutEnlargement: true,
      fit: 'inside',
    });
  }

  // Convert to WebP
  const webpBuffer = await sharpInstance
    .webp({
      quality: WEBP_QUALITY,
      effort: 4, // Balance between speed and compression
      ...(isAnimated && { loop: 0 }), // Infinite loop for animations
    })
    .toBuffer();

  // Get final dimensions
  const finalMetadata = await sharp(webpBuffer).metadata();

  // Generate unique key with .webp extension
  const key = `pins/${userId}/${randomUUID()}.webp`;

  // Upload to R2
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: webpBuffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
  });

  await r2Client.send(command);

  return {
    key,
    publicUrl: `${PUBLIC_URL}/${key}`,
    originalSize,
    convertedSize: webpBuffer.length,
    width: finalMetadata.width || 0,
    height: finalMetadata.height || 0,
  };
}
