import { config } from '../../config/env.config';
import { logger } from '../logger/logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private inMemoryStore = new Map<string, CacheEntry<any>>();
  private defaultTtlSecs: number;

  constructor() {
    this.defaultTtlSecs = config.redis.defaultTtlSecs;
    // Periodic cleanup of expired in-memory entries every 60 seconds
    setInterval(() => this.cleanupExpired(), 60000);
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.expiresAt > 0 && entry.expiresAt <= now) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.inMemoryStore.get(key);
      if (!entry) return null;

      if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
        this.inMemoryStore.delete(key);
        return null;
      }
      return entry.value as T;
    } catch (error) {
      logger.warn(`Cache get failed for key: ${key}`, { error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSecs: number = this.defaultTtlSecs): Promise<void> {
    try {
      const expiresAt = ttlSecs > 0 ? Date.now() + ttlSecs * 1000 : 0;
      this.inMemoryStore.set(key, { value, expiresAt });
    } catch (error) {
      logger.warn(`Cache set failed for key: ${key}`, { error });
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.inMemoryStore.delete(key);
    } catch (error) {
      logger.warn(`Cache delete failed for key: ${key}`, { error });
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      for (const key of this.inMemoryStore.keys()) {
        if (regex.test(key)) {
          this.inMemoryStore.delete(key);
        }
      }
    } catch (error) {
      logger.warn(`Cache deletePattern failed for pattern: ${pattern}`, { error });
    }
  }

  async clear(): Promise<void> {
    this.inMemoryStore.clear();
  }

  async flush(): Promise<void> {
    this.inMemoryStore.clear();
  }

  /**
   * Cache-aside helper: Returns cached data if available, otherwise executes loader, caches result, and returns.
   */
  async cached<T>(
    key: string,
    ttlSecs: number,
    loader: () => Promise<T>
  ): Promise<T> {
    const cachedVal = await this.get<T>(key);
    if (cachedVal !== null && cachedVal !== undefined) {
      return cachedVal;
    }

    const fresh = await loader();
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttlSecs);
    }
    return fresh;
  }
}

export const cacheService = new CacheService();
