import { Request, Response, NextFunction } from 'express';
import { logger } from '../core/logger/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const context = {
      requestId: req.id,
      method,
      path: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip,
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${originalUrl} ${statusCode} in ${duration}ms`, null, context);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} in ${duration}ms`, context);
    } else {
      logger.info(`HTTP ${method} ${originalUrl} ${statusCode} in ${duration}ms`, context);
    }
  });

  next();
}
