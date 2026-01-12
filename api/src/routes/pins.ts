import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { indexPin, deletePin as deleteFromIndex } from '../lib/elasticsearch.js';
import { createPinSchema, updatePinSchema, paginationSchema, CreatePinInput } from '../schemas/pin.js';

export async function pinRoutes(fastify: FastifyInstance) {
  // Get all pins (paginated)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = paginationSchema.parse(request.query);
      const { page, limit } = query;
      const skip = (page - 1) * limit;

      const [pins, total] = await Promise.all([
        prisma.pin.findMany({
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
        prisma.pin.count(),
      ]);

      return reply.send({
        pins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get single pin
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const pin = await prisma.pin.findUnique({
        where: { id },
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

      if (!pin) {
        return reply.status(404).send({ error: 'Pin not found' });
      }

      return reply.send({ pin });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Create pin (protected)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createPinSchema.parse(request.body);
      const { userId } = request.user;

      const pin = await prisma.pin.create({
        data: {
          ...body,
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

      // Index in Elasticsearch
      indexPin({
        id: pin.id,
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        tags: pin.tags,
        userId: pin.userId,
        username: pin.user.username,
        createdAt: pin.createdAt.toISOString(),
      });

      return reply.status(201).send({ pin });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update pin (protected, owner only)
  fastify.patch<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updatePinSchema.parse(request.body);
      const { userId } = request.user;

      // Check if pin exists and belongs to user
      const existingPin = await prisma.pin.findUnique({
        where: { id },
      });

      if (!existingPin) {
        return reply.status(404).send({ error: 'Pin not found' });
      }

      if (existingPin.userId !== userId) {
        return reply.status(403).send({ error: 'You can only update your own pins' });
      }

      const pin = await prisma.pin.update({
        where: { id },
        data: body,
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

      // Update in Elasticsearch
      indexPin({
        id: pin.id,
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        tags: pin.tags,
        userId: pin.userId,
        username: pin.user.username,
        createdAt: pin.createdAt.toISOString(),
      });

      return reply.send({ pin });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete pin (protected, owner only)
  fastify.delete<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { userId } = request.user;

      // Check if pin exists and belongs to user
      const existingPin = await prisma.pin.findUnique({
        where: { id },
      });

      if (!existingPin) {
        return reply.status(404).send({ error: 'Pin not found' });
      }

      if (existingPin.userId !== userId) {
        return reply.status(403).send({ error: 'You can only delete your own pins' });
      }

      await prisma.pin.delete({
        where: { id },
      });

      // Remove from Elasticsearch
      deleteFromIndex(id);

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get pins by user
  fastify.get('/user/:userId', async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
    try {
      const { userId } = request.params;
      const query = paginationSchema.parse(request.query);
      const { page, limit } = query;
      const skip = (page - 1) * limit;

      const [pins, total] = await Promise.all([
        prisma.pin.findMany({
          where: { userId },
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
        prisma.pin.count({ where: { userId } }),
      ]);

      return reply.send({
        pins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
