// server/app.ts
import express, { Express } from 'express';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware, notFoundHandler } from './middleware/error-handler.middleware';
import { apiRouter } from './routes';

export function createExpressApp(): Express {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    res.setHeader('X-Download-Options', 'noopen');
    res.removeHeader('X-Powered-By');
    next();
  });

  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Mount API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandlerMiddleware);

  return app;
}