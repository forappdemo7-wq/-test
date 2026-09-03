import { createExpressApp } from './app';
import { initDatabase } from './core/database/migrations';
import { initializeJobHandlers } from './core/queue/job-handlers';
import { errorHandlerMiddleware, notFoundHandler } from './middleware/error-handler.middleware';

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
        console.error('Database migration/init notice in serverless runtime:', err);
      } finally {
        isReady = true;
      }
    })();
  }
  await initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureInitialized();
  } catch (initErr) {
    console.warn('Initialization notice:', initErr);
  }

  return new Promise((resolve) => {
    // If response is already ended, resolve immediately
    if (res.writableEnded || res.finished) {
      return resolve(undefined);
    }

    // Attach lifecycle listeners to resolve once response completes
    res.once('finish', () => resolve(undefined));
    res.once('close', () => resolve(undefined));
    res.once('error', (err: any) => {
      console.error('Serverless response stream error:', err);
      resolve(undefined);
    });

    // Execute Express application
    app(req, res, (err: any) => {
      if (err) {
        errorHandlerMiddleware(err, req, res, () => {
          if (!res.headersSent) {
            res.status(500).json({ success: false, error: { message: 'Internal Server Error' } });
          }
          resolve(undefined);
        });
      } else if (!res.headersSent) {
        notFoundHandler(req, res);
        resolve(undefined);
      }
    });
  });
}
