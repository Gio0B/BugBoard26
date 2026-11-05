import { z } from 'zod';

export const issueIdParamsSchema = z.object({ id: z.uuid('Identificatore issue non valido.') }).strict();
export const issueImageParamsSchema = z.object({
  id: z.uuid('Identificatore issue non valido.'),
  imageId: z.uuid('Identificatore immagine non valido.'),
}).strict();
export const createIssueBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(10000),
  type: z.enum(['QUESTION', 'BUG', 'DOCUMENTATION', 'FEATURE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
}).strict();
export const issueListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['QUESTION', 'BUG', 'DOCUMENTATION', 'FEATURE']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  sortBy: z.enum(['createdAt', 'priority']).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
}).strict();
export const updateIssueStatusBodySchema = z.object({
  status: z.literal('IN_PROGRESS'),
}).strict();
