// src/middleware/upload.middleware.ts
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { createError } from '../utils/AppError';

// Configure multer with in-memory storage and 5 MB file size limit
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_MIME_TYPE'));
    }
  },
});

/**
 * Middleware wrapper to handle single image upload and map Multer errors cleanly
 */
export const uploadProductImageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createError.badRequest('Product image must be 5 MB or smaller.'));
      }
      if (err.message === 'INVALID_MIME_TYPE') {
        return next(
          createError.badRequest('Invalid image format. Only JPEG, PNG, WebP, and GIF formats are accepted.')
        );
      }
      return next(createError.badRequest(err.message || 'File upload error.'));
    }
    next();
  });
};
