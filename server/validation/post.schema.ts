import { z } from 'zod';

export const CreatePostSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  caption: z.string().max(2200).optional().default(''),
  location: z.string().max(200).optional().default(''),
  media: z.array(
    z.object({
      url: z.string().min(1, 'Media URL is required'),
      type: z.enum(['image', 'video']).optional().default('image'),
      aspectRatio: z.string().optional().default('square'),
    })
  ).min(1, 'At least one media item is required'),
  tags: z.array(z.string()).optional().default([]),
  musicTrack: z
    .object({
      title: z.string(),
      artist: z.string(),
      coverUrl: z.string().optional(),
      audioUrl: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export const CreateCommentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  text: z.string().min(1, 'Comment text cannot be empty').max(1000),
});
