import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { 
  generateUploadUrl, 
  isR2Configured, 
  convertAndUploadImage,
  isValidImageType 
} from '../lib/r2.js';

const uploadRequestSchema = z.object({
  contentType: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
    { message: 'Invalid content type. Allowed: image/jpeg, image/png, image/gif, image/webp' }
  ),
  filename: z.string().optional(),
});

export async function uploadRoutes(fastify: FastifyInstance) {
  // Check if R2 is configured
  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      configured: isR2Configured(),
      message: isR2Configured()
        ? 'R2 is configured and ready for uploads'
        : 'R2 is not configured. Image uploads will use external URLs.',
    });
  });

  // Get a presigned URL for uploading (protected) - kept for backward compatibility
  fastify.post(
    '/presigned-url',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!isR2Configured()) {
          return reply.status(503).send({
            error: 'Image uploads are not configured',
            message: 'R2 storage is not set up. Please use external image URLs.',
          });
        }

        const { contentType } = uploadRequestSchema.parse(request.body);
        const { userId } = request.user;

        const result = await generateUploadUrl(contentType, userId);

        return reply.send({
          uploadUrl: result.uploadUrl,
          key: result.key,
          publicUrl: result.publicUrl,
        });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate upload URL' });
      }
    }
  );

  // Upload image with WebP conversion (protected)
  fastify.post(
    '/image',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (!isR2Configured()) {
          return reply.status(503).send({
            error: 'Image uploads are not configured',
            message: 'R2 storage is not set up. Please use external image URLs.',
          });
        }

        const { userId } = request.user;

        // Get uploaded file
        const data = await request.file();
        
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Validate content type
        if (!isValidImageType(data.mimetype)) {
          return reply.status(400).send({ 
            error: 'Invalid file type',
            message: 'Allowed: image/jpeg, image/png, image/gif, image/webp'
          });
        }

        // Read the file buffer
        const buffer = await data.toBuffer();

        // Check file size
        if (buffer.length > 10 * 1024 * 1024) {
          return reply.status(400).send({ 
            error: 'File too large',
            message: 'Maximum file size is 10MB'
          });
        }

        // Convert to WebP and upload
        const result = await convertAndUploadImage(buffer, userId, data.mimetype);

        // Calculate compression ratio
        const compressionRatio = ((1 - result.convertedSize / result.originalSize) * 100).toFixed(1);

        fastify.log.info({
          msg: 'Image uploaded and converted to WebP',
          userId,
          originalSize: result.originalSize,
          convertedSize: result.convertedSize,
          compressionRatio: `${compressionRatio}%`,
          dimensions: `${result.width}x${result.height}`,
        });

        return reply.send({
          publicUrl: result.publicUrl,
          key: result.key,
          width: result.width,
          height: result.height,
          originalSize: result.originalSize,
          convertedSize: result.convertedSize,
          compressionRatio: `${compressionRatio}%`,
        });
      } catch (error: any) {
        fastify.log.error(error);
        
        if (error.message?.includes('Input buffer')) {
          return reply.status(400).send({ 
            error: 'Invalid image',
            message: 'The uploaded file is not a valid image'
          });
        }
        
        return reply.status(500).send({ error: 'Failed to upload image' });
      }
    }
  );
}
