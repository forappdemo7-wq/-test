import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.headers['x-request-id'] as string;
  const requestId = incomingId || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
