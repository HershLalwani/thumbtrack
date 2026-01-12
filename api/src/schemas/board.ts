import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  isPrivate: z.boolean().default(false),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional().nullable(),
  isPrivate: z.boolean().optional(),
});

export const savePinSchema = z.object({
  pinId: z.string().min(1, 'Pin ID is required'),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type SavePinInput = z.infer<typeof savePinSchema>;
