// api/index.ts
import { createExpressApp } from '../server/app';
import { initDatabase } from '../server/core/database/migrations';
import { initializeJobHandlers } from '../server/core/queue/job-handlers';
import { errorHandlerMiddleware } from '../server/middleware/error-handler.middleware';

const app = createExpressApp();
app.use(errorHandlerMiddleware);

let isReady = false;
let initError: Error | null = null;

async function ensureInitialized() {
  if (isReady) return;
  if (initError) throw initError; // propagate known error

  try {
    // Run migrations and init queue – fail gracefully
    await initDatabase().catch((err) => {
      console.error('Database init error:', err);
      throw new Error(`Database initialization failed: ${err.message}`);
    });

    await initializeJobHandlers().catch((err) => {
      console.error('Job handler init error:', err);
      // non‑critical – we can still serve API
    });

    isReady = true;
  } catch (err) {
    initError = err as Error;
    throw initError;
  }
}

export default async function handler(req: any, res: any) {
  try {
    await ensureInitialized();
    return app(req, res);
  } catch (err) {
    // Return a clear error instead of crashing the function
    res.status(500).json({
      error: 'Server initialization failed',
      details: (err as Error).message,
    });
  }
}