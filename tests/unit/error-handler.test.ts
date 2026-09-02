import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ConflictError,
} from '../../server/core/errors/app-error';
import { ErrorCode } from '../../server/core/errors/error-codes';

describe('AppError Hierarchy (Unit Tests)', () => {
  it('should construct NotFoundError with 404 status and NOT_FOUND code', () => {
    const err = new NotFoundError('Post');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
    expect(err.message).toBe('Post not found');
    expect(err.isOperational).toBe(true);
  });

  it('should construct ValidationError with 422 status and detailed field errors', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = new ValidationError('Invalid input', details);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(err.details).toEqual(details);
  });

  it('should construct ConflictError with 409 status', () => {
    const err = new ConflictError('Username taken');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe(ErrorCode.CONFLICT);
  });
});
