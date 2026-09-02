import { z } from 'zod';

export const CreateStorySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  mediaUrl: z.string().min(1, 'Media URL is required'),
  mediaType: z.enum(['image', 'video']).optional().default('image'),
  caption: z.string().max(500).optional().default(''),
  filter: z.string().optional().default('normal'),
  link: z.string().optional().default(''),
});

export const CreateHighlightSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(50),
  coverUrl: z.string().optional(),
  items: z.array(z.any()).optional().default([]),
});
