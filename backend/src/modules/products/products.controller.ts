// src/modules/products/products.controller.ts
import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service';
import { createProductSchema, updateProductSchema } from './products.schema';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

import { createError } from '../../utils/AppError';

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

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw createError.badRequest('No image file provided. Key must be "image"');
      }
      const result = await productsService.uploadImage(req.params.id, req.file);
      sendSuccess(
        res,
        { imageKey: result.imageKey, imageUrl: result.imageUrl },
        200,
        'Product image uploaded successfully'
      );
    } catch (err) {
      next(err);
    }
  },

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await productsService.deleteImage(req.params.id);
      sendSuccess(res, null, 200, 'Product image deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};
