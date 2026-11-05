import { z } from 'zod';

export const createCommentBodySchema = z.object({
  text: z.string().trim().min(1).max(5000),
}).strict();

export const commentListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
}).strict();
