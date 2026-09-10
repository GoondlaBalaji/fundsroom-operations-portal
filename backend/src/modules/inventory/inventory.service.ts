// src/modules/inventory/inventory.service.ts
import { MovementType } from '../../types/enums';
import { prisma } from '../../config/database';
import { createError } from '../../utils/AppError';
import type { CreateMovementInput } from './inventory.schema';

export const inventoryService = {
  async listMovements(params: {
    page: number;
    limit: number;
    skip: number;
    productId?: string;
    movementType?: MovementType;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (params.productId) where.productId = params.productId;
    if (params.movementType) where.movementType = params.movementType;

    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) where.createdAt.gte = new Date(params.fromDate);
      if (params.toDate) {
        const to = new Date(params.toDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { data, total };
  },

  async createInMovement(input: CreateMovementInput, userId: string) {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, isActive: true },
    });

    if (!product) throw createError.notFound('Product');

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId: input.productId,
          quantity: input.quantity,
          movementType: MovementType.IN,
          reason: input.reason,
          createdById: userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.product.update({
        where: { id: input.productId },
        data: { stock: { increment: input.quantity } },
      }),
    ]);

    return movement;
  },

  async getLowStockProducts() {
    // Prisma doesn't support comparing two columns in WHERE, use raw query
    const products = await prisma.$queryRaw<any[]>`
      SELECT id, name, sku, category, "unitPrice", stock, "minStockAlert", "warehouseLocation"
      FROM products
      WHERE "isActive" = true AND stock < "minStockAlert"
      ORDER BY (stock - "minStockAlert") ASC
    `;
    return products;
  },
};
