import { createExpressApp } from '../server/app';
import { initDatabase } from '../server/core/database/migrations';
import { initializeJobHandlers } from '../server/core/queue/job-handlers';
import { errorHandlerMiddleware } from '../server/middleware/error-handler.middleware';

const app = createExpressApp();
app.use(errorHandlerMiddleware);

let isReady = false;
let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (isReady) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initDatabase();
        initializeJobHandlers();
      } catch (err) {
        console.error('Database migration/init error in serverless runtime:', err);
      } finally {
        isReady = true;
      }
    })();
  }
  await initPromise;
}

export default async function handler(req: any, res: any) {
  await ensureInitialized();
  return app(req, res);
}
