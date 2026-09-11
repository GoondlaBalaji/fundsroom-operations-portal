// src/modules/challans/challans.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ChallanStatus } from '../../types/enums';
import { challansService } from './challans.service';
import { createChallanSchema, cancelChallanSchema } from './challans.schema';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export const challansController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPagination(req);
      const status = req.query.status as ChallanStatus | undefined;
      const customerId = req.query.customer_id as string | undefined;
      const search = req.query.search as string | undefined;

      const { data, total } = await challansService.list({ ...pagination, status, customerId, search });
      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challansService.getById(req.params.id);
      sendSuccess(res, challan);
    } catch (err) {
      next(err);
    }
  },

  async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { buffer, challanNumber } = await challansService.generatePdf(id);
      const safeFilename = `${challanNumber.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createChallanSchema.parse(req.body);
      const challan = await challansService.create(input, req.user!.id);
      sendSuccess(res, challan, 201, 'Challan created successfully');
    } catch (err) {
      next(err);
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const challan = await challansService.confirm(req.params.id, req.user!.id);
      sendSuccess(res, challan, 200, 'Challan confirmed successfully');
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = cancelChallanSchema.parse(req.body);
      const challan = await challansService.cancel(req.params.id, input);
      sendSuccess(res, challan, 200, 'Challan cancelled successfully');
    } catch (err) {
      next(err);
    }
  },
};
