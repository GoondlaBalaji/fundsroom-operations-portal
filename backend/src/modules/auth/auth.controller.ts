// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { loginSchema } from './auth.schema';
import { authService } from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      sendSuccess(res, result, 200, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },
};
