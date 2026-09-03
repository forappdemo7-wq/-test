import express, { Express } from 'express';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { errorHandlerMiddleware, notFoundHandler } from './middleware/error-handler.middleware';
import { apiRouter } from './routes';

export function createExpressApp(): Express {
  const app = express();

  // Safe Body Parser for Serverless & Standard Node
  app.use((req, res, next) => {
    if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
      try {
        req.body = JSON.parse(req.body);
      } catch {
        // pass through to standard body parsers
      }
    }
    next();
  });

  // Core Parsers & Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Security Headers Middleware (Production-hardened, iframe-compatible)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    res.setHeader('X-Download-Options', 'noopen');
    res.removeHeader('X-Powered-By');
    next();
  });

  // Tracing and Structured Logging
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Mount API Router on /api and root fallback
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  return app;
}
