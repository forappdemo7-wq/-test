import { Router } from 'express';
import { v1Router } from './v1';

const apiRouter = Router();

// Versioned API v1
apiRouter.use('/v1', v1Router);

// Documentation alias
apiRouter.get('/docs', (req, res) => res.redirect('/api/v1/docs'));
apiRouter.get('/swagger.json', (req, res) => res.redirect('/api/v1/swagger.json'));

// Backward compatibility mounts so existing client calls to /api/* resolve seamlessly
apiRouter.use('/', v1Router);

export { apiRouter };
