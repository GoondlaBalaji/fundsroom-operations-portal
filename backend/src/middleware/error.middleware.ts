// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { config } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 400, 'VALIDATION_ERROR', 'Validation failed', details);
    return;
  }

  // Custom operational errors
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') || 'field';
      sendError(res, 409, 'CONFLICT', `A record with this ${fields} already exists`);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Record not found');
      return;
    }
    if (err.code === 'P2003') {
      sendError(res, 400, 'FOREIGN_KEY_ERROR', 'Referenced record does not exist');
      return;
    }
  }

  // Unknown errors — don't expose internals in production
  console.error('Unhandled error:', err);
  sendError(
    res,
    500,
    'INTERNAL_ERROR',
    config.isProduction ? 'An internal server error occurred' : err.message
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
};
