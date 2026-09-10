// src/utils/apiResponse.ts
import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = 'Success'
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): Response => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  errorCode: string,
  message: string,
  details?: unknown
): Response => {
  return res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    ...(details !== undefined && { details }),
  });
};
