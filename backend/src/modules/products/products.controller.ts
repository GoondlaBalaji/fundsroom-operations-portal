// src/modules/products/products.controller.ts
import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { createProductSchema, updateProductSchema } from './products.schema';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export const productsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPagination(req);
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const lowStock = req.query.low_stock === 'true';

      const { data, total } = await productsService.list({ ...pagination, search, category, lowStock });
      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.getById(req.params.id);
      sendSuccess(res, product);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createProductSchema.parse(req.body);
      const product = await productsService.create(input, req.user!.id);
      sendSuccess(res, product, 201, 'Product created successfully');
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateProductSchema.parse(req.body);
      const product = await productsService.update(req.params.id, input);
      sendSuccess(res, product, 200, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await productsService.getCategories();
      sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  },
};
