import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { esClient } from '../lib/elasticsearch.js';

export async function recommendationRoutes(fastify: FastifyInstance) {
  // Get personalized recommendations for authenticated user
  fastify.get(
    '/for-you',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.user;
        const limit = 40;

        // Get user's interests based on:
        // 1. Tags from pins they've saved
        // 2. Tags from pins they've created
        // 3. Tags from pins of users they follow

        const [savedPinTags, memberBoardPinTags, createdPinTags, followingPinTags] = await Promise.all([
          // Tags from pins saved to user's own boards
          prisma.savedPin.findMany({
            where: {
              board: { userId }, // Pins in boards owned by the user
            },
            select: { pin: { select: { tags: true } } },
            take: 50,
            orderBy: { createdAt: 'desc' },
          }),
          // Tags from pins in boards user is a member of
          prisma.savedPin.findMany({
            where: {
              board: {
                members: { some: { userId } },
              },
            },
            select: { pin: { select: { tags: true } } },
            take: 30,
            orderBy: { createdAt: 'desc' },
          }),
          // Tags from created pins
          prisma.pin.findMany({
            where: { userId },
            select: { tags: true },
            take: 20,
          }),
          // Tags from following users' pins
          prisma.follow.findMany({
            where: { followerId: userId },
            select: {
              following: {
                select: {
                  pins: {
                    select: { tags: true },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
            take: 10,
          }),
        ]);

        // Collect and count tag frequencies
        const tagCounts = new Map<string, number>();

        // Saved pins have highest weight
        savedPinTags.forEach((sp) => {
          sp.pin.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 3);
          });
        });

        // Pins from boards user is a member of
        memberBoardPinTags.forEach((sp) => {
          sp.pin.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 2);
          });
        });

        // User's own created pins
        createdPinTags.forEach((pin) => {
          pin.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 2);
          });
        });

        // Following users' pins have lowest weight
        followingPinTags.forEach((follow) => {
          follow.following.pins.forEach((pin) => {
            pin.tags.forEach((tag) => {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
          });
        });

        // Get top tags
        const topTags = Array.from(tagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);

        // Get IDs of pins user has already seen/saved (via their boards and member boards)
        const [ownBoardPinIds, memberBoardPinIds, ownPinIds] = await Promise.all([
          prisma.savedPin.findMany({
            where: { board: { userId } },
            select: { pinId: true },
          }),
          prisma.savedPin.findMany({
            where: { board: { members: { some: { userId } } } },
            select: { pinId: true },
          }),
          prisma.pin.findMany({
            where: { userId },
            select: { id: true },
          }),
        ]);
        
        const excludeIds = new Set([
          ...ownBoardPinIds.map((sp) => sp.pinId),
          ...memberBoardPinIds.map((sp) => sp.pinId),
          ...ownPinIds.map((p) => p.id),
        ]);

        let recommendedPins: any[] = [];

        if (topTags.length > 0) {
          // Search for pins matching user's interests
          try {
          const result = await esClient.search({
            index: 'pins',
            size: limit * 2, // Get extra to account for filtering
            query: {
              bool: {
                should: topTags.map((tag) => ({
                  match: { tags: { query: tag, boost: tagCounts.get(tag) || 1 } },
                })),
                must_not: [
                  { terms: { id: Array.from(excludeIds) } },
                ],
              },
            },
            sort: [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
          });

            const pinIds = result.hits.hits
              .map((hit: any) => hit._source.id)
              .filter((id: string) => !excludeIds.has(id))
              .slice(0, limit);

            if (pinIds.length > 0) {
              recommendedPins = await prisma.pin.findMany({
                where: { id: { in: pinIds } },
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

              // Maintain search order
              const pinMap = new Map(recommendedPins.map((p) => [p.id, p]));
              recommendedPins = pinIds
                .map((id: string) => pinMap.get(id))
                .filter(Boolean);
            }
        } catch (esError) {
          console.error('Elasticsearch recommendation failed:', esError);
        }
        }

        // If not enough recommendations, fill with recent popular pins
        if (recommendedPins.length < limit) {
          const remaining = limit - recommendedPins.length;
          const existingIds = new Set(recommendedPins.map((p) => p.id));

          const popularPins = await prisma.pin.findMany({
            where: {
              id: {
                notIn: [...Array.from(excludeIds), ...Array.from(existingIds)],
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
              _count: {
                select: { savedPins: true, comments: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: remaining * 2,
          });

          // Sort by engagement
          popularPins.sort(
            (a, b) =>
              b._count.savedPins + b._count.comments - (a._count.savedPins + a._count.comments)
          );

          recommendedPins = [
            ...recommendedPins,
            ...popularPins.slice(0, remaining).map(({ _count, ...pin }) => pin),
          ];
        }

        return reply.send({ pins: recommendedPins });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to get recommendations' });
      }
    }
  );

  // Get trending pins (for non-authenticated users)
  fastify.get('/trending', async (request, reply) => {
    try {
      const limit = 40;

      // Get pins with most saves and comments in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const trendingPins = await prisma.pin.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { savedPins: true, comments: true },
          },
        },
        take: limit * 2,
      });

      // Sort by engagement score
      trendingPins.sort(
        (a, b) =>
          b._count.savedPins * 2 + b._count.comments - (a._count.savedPins * 2 + a._count.comments)
      );

      const result = trendingPins.slice(0, limit).map(({ _count, ...pin }) => pin);

      return reply.send({ pins: result });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get trending pins' });
    }
  });

  // Get pins from users you follow
  fastify.get(
    '/following',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.user;

        // Get users being followed
        const following = await prisma.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        });

        if (following.length === 0) {
          return reply.send({ pins: [] });
        }

        const followingIds = following.map((f) => f.followingId);

        const pins = await prisma.pin.findMany({
          where: { userId: { in: followingIds } },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 40,
        });

        return reply.send({ pins });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Failed to get following feed' });
      }
    }
  );

  // Record a pin view (for improving recommendations)
  fastify.post<{ Params: { pinId: string } }>(
    '/view/:pinId',
    async (request, reply) => {
      try {
        const { pinId } = request.params;
        let userId: string | null = null;

        try {
          await request.jwtVerify();
          userId = request.user.userId;
        } catch {
          // Not authenticated
        }

        await prisma.pinView.create({
          data: {
            pinId,
            userId,
          },
        });

        return reply.status(201).send({ success: true });
      } catch (error) {
        // Silently fail - view tracking is non-critical
        return reply.status(201).send({ success: true });
      }
    }
  );
}
