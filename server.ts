import path from 'path';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createExpressApp } from './server/app';
import { initDatabase } from './server/core/database/migrations';
import { initializeJobHandlers } from './server/core/queue/job-handlers';
import { logger } from './server/core/logger/logger';
import { config } from './server/config/env.config';
import { errorHandlerMiddleware, notFoundHandler } from './server/middleware/error-handler.middleware';

async function bootstrap() {
  logger.info('Initializing InstaVibe Scalable Backend Services...');

  // 1. Run database schema migrations
  await initDatabase();

  // 2. Register async job workers
  initializeJobHandlers();

  // 3. Instantiate Express App
  const app = createExpressApp();

  // 4. Vite middleware for development & static asset serving for production
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Mounting Vite middleware in SPA development mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('Serving static production bundle from dist/...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Global Error Handling Middleware
  app.use(errorHandlerMiddleware);

  // 6. Bind to Port 3000 on 0.0.0.0
  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`🚀 InstaVibe Server running at http://0.0.0.0:${config.port}`);
    logger.info(`📑 Interactive API Documentation: http://0.0.0.0:${config.port}/api/v1/docs`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    logger.info('Received shutdown signal. Gracefully closing HTTP server...');
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error('Fatal error during application startup:', err);
  process.exit(1);
});
