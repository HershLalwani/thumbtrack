import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/auth.js';
import { pinRoutes } from './routes/pins.js';
import { userRoutes } from './routes/users.js';
import { boardRoutes } from './routes/boards.js';
import { followRoutes } from './routes/follows.js';
import { commentRoutes } from './routes/comments.js';
import { searchRoutes } from './routes/search.js';
import { recommendationRoutes } from './routes/recommendations.js';
import { uploadRoutes } from './routes/uploads.js';
import { authPlugin } from './plugins/auth.js';
import { initializeElasticsearch } from './lib/elasticsearch.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: true,
  });

  // Initialize Elasticsearch
  await initializeElasticsearch();

  // Register CORS
  await fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Register JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  });

  // Register multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  });

  // Register auth plugin (adds authenticate decorator)
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(pinRoutes, { prefix: '/pins' });
  await fastify.register(userRoutes, { prefix: '/users' });
  await fastify.register(boardRoutes, { prefix: '/boards' });
  await fastify.register(followRoutes, { prefix: '/users' });
  await fastify.register(commentRoutes, { prefix: '/comments' });
  await fastify.register(searchRoutes, { prefix: '/search' });
  await fastify.register(recommendationRoutes, { prefix: '/recommendations' });
  await fastify.register(uploadRoutes, { prefix: '/uploads' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  return fastify;
}
