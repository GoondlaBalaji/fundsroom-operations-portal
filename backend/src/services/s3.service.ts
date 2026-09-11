// src/services/s3.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { config } from '../config/env';
import { createError } from '../utils/AppError';

// Allowed MIME types and their trusted extensions
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// S3 Client configuration
const s3Config: any = {
  region: config.aws.region || 'ap-south-1',
};

if (config.aws.accessKeyId && config.aws.secretAccessKey) {
  s3Config.credentials = {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  };
}

export const s3Client = new S3Client(s3Config);

/**
 * Validate image buffer magic numbers/header bytes
 */
export function validateImageSignature(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 12) return false;

  switch (mimeType) {
    case 'image/jpeg':
      // JPEG starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case 'image/png':
      // PNG starts with 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );

    case 'image/webp':
      // WebP starts with 'RIFF' .... 'WEBP'
      const riff = buffer.toString('ascii', 0, 4);
      const webp = buffer.toString('ascii', 8, 12);
      return riff === 'RIFF' && webp === 'WEBP';

    case 'image/gif':
      // GIF starts with GIF87a or GIF89a
      const gif = buffer.toString('ascii', 0, 6);
      return gif === 'GIF87a' || gif === 'GIF89a';

    default:
      return false;
  }
}

export const s3Service = {
  /**
   * Validate image file properties
   */
  validateImageFile(file: Express.Multer.File): { extension: string } {
    if (!file || !file.buffer) {
      throw createError.badRequest('No image file provided.');
    }

    if (file.size > MAX_IMAGE_SIZE || file.buffer.length > MAX_IMAGE_SIZE) {
      throw createError.badRequest('Product image must be 5 MB or smaller.');
    }

    const mime = file.mimetype.toLowerCase();
    const extension = ALLOWED_MIME_TYPES[mime];

    if (!extension) {
      throw createError.badRequest(
        'Invalid image format. Only JPEG, PNG, WebP, and GIF formats are accepted.'
      );
    }

    // Verify magic bytes
    if (!validateImageSignature(file.buffer, mime)) {
      throw createError.badRequest(
        'Uploaded file content does not match a valid image signature.'
      );
    }

    return { extension };
  },

  /**
   * Upload product image buffer to S3
   */
  async uploadProductImage(productId: string, file: Express.Multer.File): Promise<{ imageKey: string; imageUrl: string }> {
    const { extension } = this.validateImageFile(file);

    const bucket = config.aws.bucket || 'fundsroom-product-images';
    const uuid = crypto.randomUUID();
    const imageKey = `products/${productId}/${uuid}.${extension}`;

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: imageKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        productId,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(putCommand);

    // Generate presigned GET URL (expires in 7 days / 604800s)
    let imageUrl = '';
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: imageKey,
      });
      imageUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });
    } catch (e) {
      // Fallback direct URL if presigner fails
      imageUrl = `https://${bucket}.s3.${config.aws.region || 'ap-south-1'}.amazonaws.com/${imageKey}`;
    }

    return { imageKey, imageUrl };
  },

  /**
   * Delete product image from S3
   */
  async deleteProductImage(imageKey: string): Promise<void> {
    if (!imageKey) return;

    const bucket = config.aws.bucket || 'fundsroom-product-images';

    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: imageKey,
    });

    try {
      await s3Client.send(deleteCommand);
    } catch (error) {
      console.error(`[S3] Failed to delete object ${imageKey}:`, error);
      // Non-blocking: Do not crash if object was already deleted
    }
  },

  /**
   * Generate a fresh presigned URL for an imageKey
   */
  async getPresignedUrl(imageKey: string): Promise<string> {
    if (!imageKey) return '';
    const bucket = config.aws.bucket || 'fundsroom-product-images';

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: imageKey,
    });

    return getSignedUrl(s3Client, getCommand, { expiresIn: 604800 });
  },
};
