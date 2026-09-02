import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  cursor: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  currentUserId: z.string().optional(),
});

export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID parameter is required'),
});

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  query: z.string().optional(),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
});
