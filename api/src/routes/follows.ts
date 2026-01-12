import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function followRoutes(fastify: FastifyInstance) {
  // Follow a user
  fastify.post<{ Params: { username: string } }>(
    '/:username/follow',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { username } = request.params;
        const { userId } = request.user;

        // Find target user
        const targetUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (!targetUser) {
          return reply.status(404).send({ error: 'User not found' });
        }

        if (targetUser.id === userId) {
          return reply.status(400).send({ error: 'You cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: targetUser.id,
            },
          },
        });

        if (existingFollow) {
          return reply.status(400).send({ error: 'Already following this user' });
        }

        await prisma.follow.create({
          data: {
            followerId: userId,
            followingId: targetUser.id,
          },
        });

        return reply.status(201).send({ success: true });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Unfollow a user
  fastify.delete<{ Params: { username: string } }>(
    '/:username/follow',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { username } = request.params;
        const { userId } = request.user;

        // Find target user
        const targetUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (!targetUser) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: targetUser.id,
            },
          },
        });

        if (!follow) {
          return reply.status(400).send({ error: 'Not following this user' });
        }

        await prisma.follow.delete({
          where: { id: follow.id },
        });

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Check if following a user
  fastify.get<{ Params: { username: string } }>(
    '/:username/following',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { username } = request.params;
        const { userId } = request.user;

        const targetUser = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        });

        if (!targetUser) {
          return reply.status(404).send({ error: 'User not found' });
        }

        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: targetUser.id,
            },
          },
        });

        return reply.send({ isFollowing: !!follow });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get user's followers
  fastify.get<{ Params: { username: string }; Querystring: { page?: string; limit?: string } }>(
    '/:username/followers',
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

        const [followers, total] = await Promise.all([
          prisma.follow.findMany({
            where: { followingId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              follower: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  bio: true,
                },
              },
            },
          }),
          prisma.follow.count({ where: { followingId: user.id } }),
        ]);

        return reply.send({
          users: followers.map((f) => f.follower),
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

  // Get users that a user is following
  fastify.get<{ Params: { username: string }; Querystring: { page?: string; limit?: string } }>(
    '/:username/following-list',
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

        const [following, total] = await Promise.all([
          prisma.follow.findMany({
            where: { followerId: user.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              following: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  bio: true,
                },
              },
            },
          }),
          prisma.follow.count({ where: { followerId: user.id } }),
        ]);

        return reply.send({
          users: following.map((f) => f.following),
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
