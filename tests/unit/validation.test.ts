import { describe, it, expect } from 'vitest';
import { SignupSchema, SigninSchema } from '../../server/validation/auth.schema';
import { CreatePostSchema } from '../../server/validation/post.schema';

describe('Validation Schemas (Unit Tests)', () => {
  it('should validate valid signup payload', async () => {
    const valid = {
      username: 'cool_creator',
      name: 'Cool Creator',
      email: 'creator@example.com',
      password: 'StrongPassword123!',
    };

    const result = await SignupSchema.parseAsync(valid);
    expect(result.username).toBe('cool_creator');
    expect(result.email).toBe('creator@example.com');
  });

  it('should reject invalid username with illegal characters', async () => {
    const invalid = {
      username: 'invalid user with spaces!',
      name: 'User',
      email: 'user@example.com',
      password: 'StrongPassword123!',
    };

    await expect(SignupSchema.parseAsync(invalid)).rejects.toThrow();
  });

  it('should reject post creation without media items', async () => {
    const invalidPost = {
      userId: 'user_1',
      caption: 'Look at this!',
      media: [],
    };

    await expect(CreatePostSchema.parseAsync(invalidPost)).rejects.toThrow();
  });
});
