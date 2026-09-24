import { z } from 'zod';

export const CreateReelSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  videoUrl: z.string().min(1, 'Video URL is required'),
  posterUrl: z.string().optional(),
  caption: z.string().max(2200).optional().default(''),
  musicTrack: z.any().optional(),
  tags: z.array(z.string()).optional().default([]),
  duration: z.number().min(1).max(300).optional().default(15),
});

export const CreateReelCommentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  text: z.string().min(1, 'Comment text cannot be empty').max(1000),
});

export const RecordWatchHistorySchema = z.object({
  userId: z.string().optional().default('user_current'),
  watchDurationSecs: z.number().optional().default(0),
  progressPercent: z.number().min(0).max(100).optional().default(0),
});
