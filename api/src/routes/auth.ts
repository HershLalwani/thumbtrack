import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { registerSchema, loginSchema, RegisterInput, LoginInput } from '../schemas/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);
      const { email, username, password } = body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return reply.status(400).send({
          error: existingUser.email === email ? 'Email already in use' : 'Username already taken',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = fastify.jwt.sign({ userId: user.id });

      return reply.status(201).send({
        user,
        token,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);
      const { email, password } = body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      // Generate token
      const token = fastify.jwt.sign({ userId: user.id });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: { pins: true },
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
}
