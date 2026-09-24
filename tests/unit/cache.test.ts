import { describe, it, expect, beforeEach } from 'vitest';
import { cacheService } from '../../server/core/cache/redis-cache';

describe('RedisCacheService (Unit Tests)', () => {
  beforeEach(async () => {
    await cacheService.flush();
  });

  it('should store and retrieve string values correctly', async () => {
    await cacheService.set('test_key', 'hello_world', 60);
    const value = await cacheService.get<string>('test_key');
    expect(value).toBe('hello_world');
  });

  it('should store and retrieve complex JSON objects', async () => {
    const userObj = { id: 'u_123', username: 'sarah_art', roles: ['creator', 'verified'] };
    await cacheService.set('user:u_123', userObj, 60);
    const retrieved = await cacheService.get<typeof userObj>('user:u_123');
    expect(retrieved).toEqual(userObj);
  });

  it('should delete keys properly', async () => {
    await cacheService.set('temp_key', 'value', 60);
    await cacheService.delete('temp_key');
    const result = await cacheService.get('temp_key');
    expect(result).toBeNull();
  });

  it('should handle pattern deletion correctly', async () => {
    await cacheService.set('posts:page:1', 'p1', 60);
    await cacheService.set('posts:page:2', 'p2', 60);
    await cacheService.set('user:1', 'u1', 60);

    await cacheService.deletePattern('posts:*');

    expect(await cacheService.get('posts:page:1')).toBeNull();
    expect(await cacheService.get('posts:page:2')).toBeNull();
    expect(await cacheService.get('user:1')).toBe('u1');
  });
});
