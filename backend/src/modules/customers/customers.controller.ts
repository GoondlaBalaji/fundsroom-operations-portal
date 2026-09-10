// src/modules/customers/customers.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CustomerStatus, CustomerType } from '../../types/enums';
import { customersService } from './customers.service';
import { createCustomerSchema, updateCustomerSchema, createFollowUpSchema } from './customers.schema';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export const customersController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = getPagination(req);
      const search = req.query.search as string | undefined;
      const status = req.query.status as CustomerStatus | undefined;
      const customerType = req.query.customer_type as CustomerType | undefined;

      const { data, total } = await customersService.list({
        ...pagination,
        search,
        status,
        customerType,
      });
      sendPaginated(res, data, total, pagination.page, pagination.limit);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customersService.getById(req.params.id);
      sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createCustomerSchema.parse(req.body);
      const customer = await customersService.create(input, req.user!.id);
      sendSuccess(res, customer, 201, 'Customer created successfully');
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateCustomerSchema.parse(req.body);
      const customer = await customersService.update(req.params.id, input);
      sendSuccess(res, customer, 200, 'Customer updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async addFollowUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createFollowUpSchema.parse(req.body);
      const followUp = await customersService.addFollowUp(req.params.id, input, req.user!.id);
      sendSuccess(res, followUp, 201, 'Follow-up added successfully');
    } catch (err) {
      next(err);
    }
  },

  async getFollowUps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followUps = await customersService.getFollowUps(req.params.id);
      sendSuccess(res, followUps);
    } catch (err) {
      next(err);
    }
  },
};
