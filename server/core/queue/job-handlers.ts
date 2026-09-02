import { jobQueue } from './queue';
import { JobType } from './job-types';
import { query } from '../database/pool';
import { logger } from '../logger/logger';

export function initializeJobHandlers() {
  logger.info('Registering background job queue workers...');

  // 1. Dispatch Notification Handler
  jobQueue.registerHandler(JobType.DISPATCH_NOTIFICATION, async (payload) => {
    logger.debug(`[Worker] Dispatching notification to ${payload.recipientId}`);
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO notifications (id, recipient_id, sender_id, type, post_id, target_media_url, text, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())`,
      [
        notifId,
        payload.recipientId,
        payload.senderId,
        payload.type,
        payload.postId || null,
        payload.targetMediaUrl || null,
        payload.text,
      ]
    );
  });

  // 2. Process Media Handler
  jobQueue.registerHandler(JobType.PROCESS_MEDIA, async (payload) => {
    logger.debug(`[Worker] Async media processing completed for url: ${payload.mediaUrl}`);
  });

  // 3. Send Email Verification Handler
  jobQueue.registerHandler(JobType.SEND_EMAIL_VERIFICATION, async (payload) => {
    logger.info(`[Worker] Sent verification email simulation to: ${payload.email}`);
  });

  // 4. Record Metric Handler
  jobQueue.registerHandler(JobType.RECORD_METRIC, async (payload) => {
    logger.debug(`[Worker] Metric recorded: ${payload.event}`, { metadata: payload.metadata });
  });

  // 5. Pre-generate AI Cache
  jobQueue.registerHandler(JobType.PRE_GENERATE_AI_CACHE, async (payload) => {
    logger.debug(`[Worker] Pre-generating AI Explore cluster cache for user ${payload.userId}`);
  });
}
