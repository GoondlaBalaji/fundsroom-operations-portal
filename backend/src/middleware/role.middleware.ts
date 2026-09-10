// src/middleware/role.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/enums';
import { sendError } from '../utils/apiResponse';

export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        403,
        'FORBIDDEN',
        `Access denied. Required roles: ${roles.join(', ')}`
      );
      return;
    }

    next();
  };
};
