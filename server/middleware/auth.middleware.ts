import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import { UnauthorizedError, ForbiddenError } from '../core/errors/app-error';

export interface AuthUserPayload {
  id: string;
  username: string;
  email?: string;
  isVerified?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as AuthUserPayload;
      req.user = decoded;
    }
  } catch {
    // Ignore invalid tokens for optional auth routes
  }
  next();
}

export function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  if (!req.user.isVerified) {
    return next(new ForbiddenError('Account must be verified to perform this action'));
  }
  next();
}
