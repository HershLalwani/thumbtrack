import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { createBoardSchema, updateBoardSchema, savePinSchema } from '../schemas/board.js';

const addMemberSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.enum(['ADMIN', 'CONTRIBUTOR']).default('CONTRIBUTOR'),
});

// Helper to check if user can access/modify board
async function canAccessBoard(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!board) return false;
  if (board.userId === userId) return true;
  return board.members.length > 0;
}

async function isboardOwnerOrAdmin(userId: string, boardId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: {
        where: { userId, role: 'ADMIN' },
      },
    },
  });

  if (!board) return false;
  if (board.userId === userId) return true;
  return board.members.length > 0;
}

export async function boardRoutes(fastify: FastifyInstance) {
  // Get board by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const board = await prisma.board.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: { savedPins: true },
          },
        },
      });

      if (!board) {
        return reply.status(404).send({ error: 'Board not found' });
      }

      // Check if board is private and user is not the owner or member
      if (board.isPrivate) {
        let userId: string | null = null;
        try {
          await request.jwtVerify();
          userId = request.user.userId;
        } catch {
          // Not authenticated
        }

        if (userId) {
          const hasAccess = await canAccessBoard(userId, id);
          if (!hasAccess) {
            return reply.status(404).send({ error: 'Board not found' });
          }
        } else {
          return reply.status(404).send({ error: 'Board not found' });
        }
      }

      // Get board members
      const members = await prisma.boardMember.findMany({
        where: { boardId: id },
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

      return reply.send({
        board: {
          ...board,
          pinCount: board._count.savedPins,
          members: members.map((m) => ({
            ...m.user,
            role: m.role,
          })),
          isGroupBoard: members.length > 0,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get pins in a board
  fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
    '/:id/pins',
    async (request, reply) => {
      try {
        const { id } = request.params;
        const page = parseInt(request.query.page || '1', 10);
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);
        const skip = (page - 1) * limit;

        const board = await prisma.board.findUnique({
          where: { id },
          select: { id: true, isPrivate: true, userId: true },
        });

        if (!board) {
          return reply.status(404).send({ error: 'Board not found' });
        }

        // Check if board is private
        if (board.isPrivate) {
          let userId: string | null = null;
          try {
            await request.jwtVerify();
            userId = request.user.userId;
          } catch {
            // Not authenticated
          }

          if (userId !== board.userId) {
            return reply.status(404).send({ error: 'Board not found' });
          }
        }

        const [savedPins, total] = await Promise.all([
          prisma.savedPin.findMany({
            where: { boardId: id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              pin: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.savedPin.count({ where: { boardId: id } }),
        ]);

        const pins = savedPins.map((sp) => sp.pin);

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

  // Create board (protected)
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createBoardSchema.parse(request.body);
      const { userId } = request.user;

      const board = await prisma.board.create({
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

      return reply.status(201).send({ board });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update board (protected, owner only)
  fastify.patch<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateBoardSchema.parse(request.body);
      const { userId } = request.user;

      const existingBoard = await prisma.board.findUnique({
        where: { id },
      });

      if (!existingBoard) {
        return reply.status(404).send({ error: 'Board not found' });
      }

      if (existingBoard.userId !== userId) {
        return reply.status(403).send({ error: 'You can only update your own boards' });
      }

      const board = await prisma.board.update({
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

      return reply.send({ board });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete board (protected, owner only)
  fastify.delete<{ Params: { id: string } }>('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { userId } = request.user;

      const existingBoard = await prisma.board.findUnique({
        where: { id },
      });

      if (!existingBoard) {
        return reply.status(404).send({ error: 'Board not found' });
      }

      if (existingBoard.userId !== userId) {
        return reply.status(403).send({ error: 'You can only delete your own boards' });
      }

      await prisma.board.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Save pin to board (protected)
  fastify.post<{ Params: { id: string } }>('/:id/pins', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id: boardId } = request.params;
      const body = savePinSchema.parse(request.body);
      const { userId } = request.user;

      // Check if board exists and user has access
      const board = await prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        return reply.status(404).send({ error: 'Board not found' });
      }

      const hasAccess = await canAccessBoard(userId, boardId);
      if (!hasAccess) {
        return reply.status(403).send({ error: 'You do not have access to this board' });
      }

      // Check if pin exists
      const pin = await prisma.pin.findUnique({
        where: { id: body.pinId },
      });

      if (!pin) {
        return reply.status(404).send({ error: 'Pin not found' });
      }

      // Check if already saved
      const existingSave = await prisma.savedPin.findUnique({
        where: {
          pinId_boardId: {
            pinId: body.pinId,
            boardId,
          },
        },
      });

      if (existingSave) {
        return reply.status(400).send({ error: 'Pin already saved to this board' });
      }

      const savedPin = await prisma.savedPin.create({
        data: {
          pinId: body.pinId,
          boardId,
          userId, // Track who saved the pin
        },
        include: {
          pin: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      // Update board's updatedAt
      await prisma.board.update({
        where: { id: boardId },
        data: { updatedAt: new Date() },
      });

      return reply.status(201).send({ savedPin });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Validation error', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Remove pin from board (protected)
  fastify.delete<{ Params: { id: string; pinId: string } }>(
    '/:id/pins/:pinId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id: boardId, pinId } = request.params;
        const { userId } = request.user;

        // Check if board exists and user has access
        const board = await prisma.board.findUnique({
          where: { id: boardId },
        });

        if (!board) {
          return reply.status(404).send({ error: 'Board not found' });
        }

        const hasAccess = await canAccessBoard(userId, boardId);
        if (!hasAccess) {
          return reply.status(403).send({ error: 'You do not have access to this board' });
        }

        const savedPin = await prisma.savedPin.findUnique({
          where: {
            pinId_boardId: {
              pinId,
              boardId,
            },
          },
        });

        if (!savedPin) {
          return reply.status(404).send({ error: 'Pin not found in this board' });
        }

        await prisma.savedPin.delete({
          where: { id: savedPin.id },
        });

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get user's boards for saving (protected) - used in save modal
  fastify.get('/my/boards', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user;

      // Get boards user owns
      const ownedBoards = await prisma.board.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          isPrivate: true,
          _count: {
            select: { savedPins: true },
          },
        },
      });

      // Get boards user is a member of
      const memberBoards = await prisma.boardMember.findMany({
        where: { userId },
        include: {
          board: {
            select: {
              id: true,
              name: true,
              isPrivate: true,
              _count: {
                select: { savedPins: true },
              },
            },
          },
        },
      });

      const allBoards = [
        ...ownedBoards.map((b) => ({
          id: b.id,
          name: b.name,
          isPrivate: b.isPrivate,
          pinCount: b._count.savedPins,
          isOwner: true,
        })),
        ...memberBoards.map((m) => ({
          id: m.board.id,
          name: m.board.name,
          isPrivate: m.board.isPrivate,
          pinCount: m.board._count.savedPins,
          isOwner: false,
        })),
      ];

      return reply.send({ boards: allBoards });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get board members
  fastify.get<{ Params: { id: string } }>('/:id/members', async (request, reply) => {
    try {
      const { id } = request.params;

      const board = await prisma.board.findUnique({
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

      if (!board) {
        return reply.status(404).send({ error: 'Board not found' });
      }

      const members = await prisma.boardMember.findMany({
        where: { boardId: id },
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

      return reply.send({
        owner: board.user,
        members: members.map((m) => ({
          ...m.user,
          role: m.role,
          joinedAt: m.createdAt,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Add member to board (owner/admin only)
  fastify.post<{ Params: { id: string } }>(
    '/:id/members',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id: boardId } = request.params;
        const { userId } = request.user;
        const body = addMemberSchema.parse(request.body);

        // Check if user is owner or admin
        const isAdmin = await isboardOwnerOrAdmin(userId, boardId);
        if (!isAdmin) {
          return reply.status(403).send({ error: 'Only board owners and admins can add members' });
        }

        // Find user to add
        const userToAdd = await prisma.user.findUnique({
          where: { username: body.username },
          select: { id: true },
        });

        if (!userToAdd) {
          return reply.status(404).send({ error: 'User not found' });
        }

        // Check if user is already the owner
        const board = await prisma.board.findUnique({
          where: { id: boardId },
        });

        if (board?.userId === userToAdd.id) {
          return reply.status(400).send({ error: 'User is already the board owner' });
        }

        // Check if already a member
        const existingMember = await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId,
              userId: userToAdd.id,
            },
          },
        });

        if (existingMember) {
          return reply.status(400).send({ error: 'User is already a member' });
        }

        const member = await prisma.boardMember.create({
          data: {
            boardId,
            userId: userToAdd.id,
            role: body.role,
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

        return reply.status(201).send({
          member: {
            ...member.user,
            role: member.role,
            joinedAt: member.createdAt,
          },
        });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Update member role (owner only)
  fastify.patch<{ Params: { id: string; memberId: string } }>(
    '/:id/members/:memberId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id: boardId, memberId } = request.params;
        const { userId } = request.user;
        const body = z.object({ role: z.enum(['ADMIN', 'CONTRIBUTOR']) }).parse(request.body);

        // Only owner can change roles
        const board = await prisma.board.findUnique({
          where: { id: boardId },
        });

        if (!board || board.userId !== userId) {
          return reply.status(403).send({ error: 'Only the board owner can change member roles' });
        }

        const member = await prisma.boardMember.update({
          where: { id: memberId },
          data: { role: body.role },
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

        return reply.send({
          member: {
            ...member.user,
            role: member.role,
          },
        });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({ error: 'Validation error', details: error.errors });
        }
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Remove member from board (owner/admin or self)
  fastify.delete<{ Params: { id: string; memberId: string } }>(
    '/:id/members/:memberId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id: boardId, memberId } = request.params;
        const { userId } = request.user;

        const member = await prisma.boardMember.findUnique({
          where: { id: memberId },
        });

        if (!member) {
          return reply.status(404).send({ error: 'Member not found' });
        }

        // Allow if: owner, admin, or removing self
        const isAdmin = await isboardOwnerOrAdmin(userId, boardId);
        const isSelf = member.userId === userId;

        if (!isAdmin && !isSelf) {
          return reply.status(403).send({ error: 'You cannot remove this member' });
        }

        await prisma.boardMember.delete({
          where: { id: memberId },
        });

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Leave board (for members)
  fastify.delete<{ Params: { id: string } }>(
    '/:id/leave',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id: boardId } = request.params;
        const { userId } = request.user;

        const member = await prisma.boardMember.findUnique({
          where: {
            boardId_userId: {
              boardId,
              userId,
            },
          },
        });

        if (!member) {
          return reply.status(400).send({ error: 'You are not a member of this board' });
        }

        await prisma.boardMember.delete({
          where: { id: member.id },
        });

        return reply.status(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
