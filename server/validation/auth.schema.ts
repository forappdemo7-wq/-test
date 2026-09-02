import { z } from 'zod';

export const SignupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username must only contain letters, numbers, underscores, and dots'),
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  pronouns: z.string().optional(),
  rememberMe: z.boolean().optional(),
  clientDevice: z.any().optional(),
});

export const SigninSchema = z
  .object({
    login: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
    clientDevice: z.any().optional(),
  })
  .refine((data) => Boolean(data.login || data.identifier), {
    message: 'Username or email is required',
    path: ['identifier'],
  });

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(300).optional(),
  avatar: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional(),
});

export const FollowToggleSchema = z.object({
  currentUserId: z.string().min(1, 'Current user ID is required'),
});

