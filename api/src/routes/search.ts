import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { searchPins, getSuggestions, getPopularTags, isElasticsearchAvailable } from '../lib/elasticsearch.js';
import { prisma } from '../lib/prisma.js';

// Database fallback search
async function dbSearchPins(query: string, tags: string[], page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  const [pins, total] = await Promise.all([
    prisma.pin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    }),
    prisma.pin.count({ where }),
  ]);

  return {
    pins,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// Database fallback for popular tags
async function dbGetPopularTags(limit: number) {
  const pins = await prisma.pin.findMany({
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  pins.forEach((pin) => {
    pin.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

export async function searchRoutes(fastify: FastifyInstance) {
  // Search pins
  fastify.get<{
    Querystring: { q?: string; tags?: string; page?: string; limit?: string };
  }>('/', async (request, reply) => {
    try {
      const query = request.query.q || '';
      const tags = request.query.tags?.split(',').filter(Boolean) || [];
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);

      // Use database fallback if Elasticsearch is not available
      if (!isElasticsearchAvailable()) {
        const result = await dbSearchPins(query, tags, page, limit);
        return reply.send(result);
      }

      const result = await searchPins(query, { page, limit, tags });

      // Fetch full pin data from database
      const pinIds = result.pins.map((p) => p.id);
      const fullPins = await prisma.pin.findMany({
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
      const pinMap = new Map(fullPins.map((p) => [p.id, p]));
      const orderedPins = pinIds
        .map((id) => pinMap.get(id))
        .filter(Boolean);

      return reply.send({
        pins: orderedPins,
        pagination: result.pagination,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Search failed' });
    }
  });

  // Get search suggestions (autocomplete)
  fastify.get<{ Querystring: { q: string } }>('/suggestions', async (request, reply) => {
    try {
      const query = request.query.q || '';
      if (!query || query.length < 2) {
        return reply.send({ suggestions: [] });
      }

      const suggestions = await getSuggestions(query);
      return reply.send({ suggestions });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get suggestions' });
    }
  });

  // Get popular/trending tags
  fastify.get('/tags/popular', async (request, reply) => {
    try {
      const tags = isElasticsearchAvailable()
        ? await getPopularTags(20)
        : await dbGetPopularTags(20);
      return reply.send({ tags });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get popular tags' });
    }
  });

  // Get pins by tag
  fastify.get<{
    Params: { tag: string };
    Querystring: { page?: string; limit?: string };
  }>('/tags/:tag', async (request, reply) => {
    try {
      const { tag } = request.params;
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);

      // Use database fallback if Elasticsearch is not available
      if (!isElasticsearchAvailable()) {
        const result = await dbSearchPins('', [tag], page, limit);
        return reply.send({ tag, ...result });
      }

      const result = await searchPins('', { page, limit, tags: [tag] });

      // Fetch full pin data from database
      const pinIds = result.pins.map((p) => p.id);
      const fullPins = await prisma.pin.findMany({
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

      const pinMap = new Map(fullPins.map((p) => [p.id, p]));
      const orderedPins = pinIds
        .map((id) => pinMap.get(id))
        .filter(Boolean);

      return reply.send({
        tag,
        pins: orderedPins,
        pagination: result.pagination,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get pins by tag' });
    }
  });
}
