import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
});

export async function commentRoutes(fastify: FastifyInstance) {
  // Get comments for a pin
  fastify.get<{ Params: { pinId: string }; Querystring: { page?: string; limit?: string } }>(
    '/pin/:pinId',
    async (request, reply) => {
      try {
        const { pinId } = request.params;
        const page = parseInt(request.query.page || '1', 10);
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
        const skip = (page - 1) * limit;

        // Check if pin exists
        const pin = await prisma.pin.findUnique({
          where: { id: pinId },
          select: { id: true },
        });

        if (!pin) {
          return reply.status(404).send({ error: 'Pin not found' });
        }

        const [comments, total] = await Promise.all([
          prisma.comment.findMany({
            where: { pinId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          }),
          prisma.comment.count({ where: { pinId } }),
        ]);

        return reply.send({
          comments,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Create a comment on a pin
  fastify.post<{ Params: { pinId: string } }>(
    '/pin/:pinId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { pinId } = request.params;
        const { userId } = request.user;
        const body = createCommentSchema.parse(request.body);

        // Check if pin exists
        const pin = await prisma.pin.findUnique({
          where: { id: pinId },
          select: { id: true },
        });

        if (!pin) {
          return reply.status(404).send({ error: 'Pin not found' });
        }

        const comment = await prisma.comment.create({
          data: {
            content: body.content,
            pinId,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        });

        return reply.status(201).send({ comment });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Update a comment
  fastify.patch<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { userId } = request.user;
        const body = createCommentSchema.parse(request.body);

        const comment = await prisma.comment.findUnique({
          where: { id },
        });

        if (!comment) {
          return reply.status(404).send({ error: 'Comment not found' });
        }

        if (comment.userId !== userId) {
          return reply.status(403).send({ error: 'You can only edit your own comments' });
        }

        const updatedComment = await prisma.comment.update({
          where: { id },
          data: { content: body.content },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        });

        return reply.send({ comment: updatedComment });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Delete a comment
  fastify.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { userId } = request.user;

        const comment = await prisma.comment.findUnique({
          where: { id },
          include: {
            pin: {
              select: { userId: true },
            },
          },
        });

        if (!comment) {
          return reply.status(404).send({ error: 'Comment not found' });
        }

        // Allow comment owner or pin owner to delete
        if (comment.userId !== userId && comment.pin.userId !== userId) {
          return reply.status(403).send({ error: 'You cannot delete this comment' });
        }

        await prisma.comment.delete({
          where: { id },
        });

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
