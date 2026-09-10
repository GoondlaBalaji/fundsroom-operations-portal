// src/utils/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  validation: (message: string, details?: unknown) =>
    new AppError(message, 400, 'VALIDATION_ERROR', details),

  businessRule: (message: string, details?: unknown) =>
    new AppError(message, 422, 'BUSINESS_RULE_VIOLATION', details),

  insufficientStock: (details: unknown) =>
    new AppError('Insufficient stock for one or more products', 422, 'INSUFFICIENT_STOCK', details),
};
