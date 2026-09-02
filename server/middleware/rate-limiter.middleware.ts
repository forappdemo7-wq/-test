import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../core/cache/redis-cache';
import { CacheKeys } from '../core/cache/cache-keys';
import { TooManyRequestsError } from '../core/errors/app-error';
import { config } from '../config/env.config';

interface RateLimitTracker {
  count: number;
  resetAt: number;
}

export function rateLimiter(options: {
  windowMs?: number;
  max?: number;
  keyGenerator?: (req: Request) => string;
} = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const max = options.max || config.rateLimit.maxRequests;
  const defaultKeyGen = (req: Request) => req.user?.id || req.ip || 'anonymous';
  const getKey = options.keyGenerator || defaultKeyGen;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientKey = getKey(req);
      const cacheKey = CacheKeys.rateLimit(clientKey);

      let record = await cacheService.get<RateLimitTracker>(cacheKey);
      const now = Date.now();

      if (!record || record.resetAt <= now) {
        record = {
          count: 1,
          resetAt: now + windowMs,
        };
        await cacheService.set(cacheKey, record, Math.ceil(windowMs / 1000));
      } else {
        record.count++;
        const remainingTtlSecs = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
        await cacheService.set(cacheKey, record, remainingTtlSecs);
      }

      const remaining = Math.max(0, max - record.count);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

      if (record.count > max) {
        return next(
          new TooManyRequestsError(
            `Rate limit exceeded: maximum ${max} requests per ${Math.ceil(windowMs / 1000)}s`
          )
        );
      }

      next();
    } catch (error) {
      // In case of rate limiter errors, fail open to avoid service outage
      next();
    }
  };
}
