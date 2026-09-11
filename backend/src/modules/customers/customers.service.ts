// src/modules/customers/customers.service.ts
import { CustomerStatus, CustomerType } from '../../types/enums';
import { prisma } from '../../config/database';
import { createError } from '../../utils/AppError';
import type { CreateCustomerInput, UpdateCustomerInput, CreateFollowUpInput } from './customers.schema';

export const customersService = {
  async list(params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    status?: CustomerStatus;
    customerType?: CustomerType;
  }) {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { mobile: { contains: params.search, mode: 'insensitive' } },
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) where.status = params.status;
    if (params.customerType) where.customerType = params.customerType;

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
          _count: { select: { followUps: true, challans: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total };
  },

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            status: true,
            totalQuantity: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        _count: { select: { challans: true, followUps: true } },
      },
    });

    if (!customer) throw createError.notFound('Customer');
    return customer;
  },

  async create(input: CreateCustomerInput, userId: string) {
    const customer = await prisma.customer.create({
      data: {
        name: input.name,
        mobile: input.mobile,
        email: input.email || null,
        businessName: input.businessName,
        gstNumber: input.gstNumber || null,
        customerType: input.customerType,
        address: input.address,
        status: input.status,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        notes: input.notes || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return customer;
  },

  async update(id: string, input: UpdateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw createError.notFound('Customer');

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.mobile !== undefined && { mobile: input.mobile }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.businessName !== undefined && { businessName: input.businessName }),
        ...(input.gstNumber !== undefined && { gstNumber: input.gstNumber || null }),
        ...(input.customerType !== undefined && { customerType: input.customerType }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.followUpDate !== undefined && {
          followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return updated;
  },

  async addFollowUp(customerId: string, input: CreateFollowUpInput, userId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw createError.notFound('Customer');

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId,
        note: input.note,
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return followUp;
  },

  async getFollowUps(customerId: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw createError.notFound('Customer');

    const followUps = await prisma.customerFollowUp.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return followUps;
  },
};
