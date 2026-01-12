import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { generateUploadUrl, isR2Configured } from '../lib/r2.js';

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

  // Get a presigned URL for uploading (protected)
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
}
