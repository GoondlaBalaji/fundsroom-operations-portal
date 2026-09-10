// src/modules/inventory/inventory.controller.ts
import { Request, Response, NextFunction } from 'express';
import { MovementType } from '../../types/enums';
import { inventoryService } from './inventory.service';
import { createMovementSchema } from './inventory.schema';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export const inventoryController = {
  async listMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPagination(req);
      const productId = req.query.product_id as string | undefined;
      const movementType = req.query.movement_type as MovementType | undefined;
      const fromDate = req.query.from_date as string | undefined;
      const toDate = req.query.to_date as string | undefined;

      const { data, total } = await inventoryService.listMovements({
        ...pagination,
        productId,
        movementType,
        fromDate,
        toDate,
      });
      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (err) {
      next(err);
    }
  },

  async createInMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createMovementSchema.parse(req.body);
      const movement = await inventoryService.createInMovement(input, req.user!.id);
      sendSuccess(res, movement, 201, 'Stock IN movement created successfully');
    } catch (err) {
      next(err);
    }
  },

  async getLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await inventoryService.getLowStockProducts();
      sendSuccess(res, products);
    } catch (err) {
      next(err);
    }
  },
};
