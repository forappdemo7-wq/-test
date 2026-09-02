import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { postRoutes } from './post.routes';
import { storyRoutes } from './story.routes';
import { reelRoutes } from './reel.routes';
import { messageRoutes } from './message.routes';
import { notificationRoutes } from './notification.routes';
import { highlightRoutes } from './highlight.routes';
import { aiRoutes } from './ai.routes';
import { docsController } from '../../controllers/docs.controller';
import { checkDatabaseHealth } from '../../core/database/pool';
import { jobQueue } from '../../core/queue/queue';

const router = Router();

// System & Health Endpoints
router.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  const queueStats = jobQueue.getStats();
  res.json({
    status: dbHealthy ? 'healthy' : 'degraded',
    database: dbHealthy ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
    uptimeSecs: Math.floor(process.uptime()),
    queue: queueStats,
  });
});

// Swagger OpenAPI documentation endpoints
router.get('/swagger.json', docsController.getSwaggerJson.bind(docsController));
router.get('/docs', docsController.getSwaggerUI.bind(docsController));

// Resource Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/stories', storyRoutes);
router.use('/reels', reelRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/highlights', highlightRoutes);
router.use('/gemini', aiRoutes);

export const v1Router = router;
