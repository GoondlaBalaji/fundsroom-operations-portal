// src/modules/dashboard/dashboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export const dashboardController = {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  },
};
