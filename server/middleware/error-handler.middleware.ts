import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors/app-error';
import { ErrorCode, ApiErrorResponse } from '../core/errors/error-codes';
import { logger } from '../core/logger/logger';
import { config } from '../config/env.config';

export function errorHandlerMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorCode = isAppError ? err.code : ErrorCode.INTERNAL_SERVER_ERROR;
  const message = isAppError ? err.message : (config.isProduction ? 'Internal server error' : err.message || 'Unknown error');

  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details: isAppError ? err.details : undefined,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      stack: !config.isProduction ? err.stack : undefined,
    },
  };

  logger.error(
    `[ErrorHandler] ${req.method} ${req.originalUrl} - ${statusCode} ${errorCode}: ${err.message}`,
    err,
    {
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      statusCode,
    }
  );

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
  });
}
