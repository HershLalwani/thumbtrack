import { z } from 'zod';

export const createPinSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  imageUrl: z.string().url('Invalid image URL'),
  link: z.string().url('Invalid link URL').optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

export const updatePinSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters').optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  link: z.string().url('Invalid link URL').optional().nullable(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreatePinInput = z.infer<typeof createPinSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
