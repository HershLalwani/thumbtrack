import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function userRoutes(fastify: FastifyInstance) {
  // Get user profile by username
  fastify.get<{ Params: { username: string } }>('/:username', async (request, reply) => {
    try {
      const { username } = request.params;

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              pins: true,
              boards: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({ user });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get user's pins
  fastify.get<{ Params: { username: string }; Querystring: { page?: string; limit?: string } }>(
    '/:username/pins',
    async (request, reply) => {
      try {
        const { username } = request.params;
        const page = parseInt(request.query.page || '1', 10);
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
        const skip = (page - 1) * limit;

        const user = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const [pins, total] = await Promise.all([
          prisma.pin.findMany({
            where: { userId: user.id },
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
          prisma.pin.count({ where: { userId: user.id } }),
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
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get user's boards
  fastify.get<{ Params: { username: string }; Querystring: { page?: string; limit?: string } }>(
    '/:username/boards',
    async (request, reply) => {
      try {
        const { username } = request.params;
        const page = parseInt(request.query.page || '1', 10);
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
        const skip = (page - 1) * limit;

        const user = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const [boards, total] = await Promise.all([
          prisma.board.findMany({
            where: { userId: user.id },
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
              _count: {
                select: { savedPins: true },
              },
              savedPins: {
                take: 4,
                orderBy: { createdAt: 'desc' },
                include: {
                  pin: {
                    select: {
                      id: true,
                      imageUrl: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.board.count({ where: { userId: user.id } }),
        ]);

        // Transform boards to include cover images
        const transformedBoards = boards.map((board) => ({
          id: board.id,
          name: board.name,
          description: board.description,
          isPrivate: board.isPrivate,
          createdAt: board.createdAt,
          updatedAt: board.updatedAt,
          pinCount: board._count.savedPins,
          coverImages: board.savedPins.map((sp) => sp.pin.imageUrl),
        }));

        return reply.send({
          boards: transformedBoards,
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
}
