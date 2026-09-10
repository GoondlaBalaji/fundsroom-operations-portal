// src/modules/challans/challans.service.ts
import { prisma } from '../../config/database';
import { createError } from '../../utils/AppError';
import { generateChallanNumber } from '../../utils/challanNumber';
import { ChallanStatus, MovementType } from '../../types/enums';
import type { CreateChallanInput, CancelChallanInput } from './challans.schema';

export const challansService = {
  async list(params: {
    page: number;
    limit: number;
    skip: number;
    status?: string;
    customerId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.search) {
      where.challanNumber = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);

    return { data, total };
  },

  async getById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, businessName: true, mobile: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stock: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!challan) throw createError.notFound('Challan');
    return challan;
  },

  async create(input: CreateChallanInput, userId: string) {
    // Validate customer
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw createError.notFound('Customer');

    // Validate all products exist
    const productIds = input.items.map((i: { productId: string; quantity: number }) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p: { id: string }) => p.id);
      const missing = productIds.filter((id: string) => !foundIds.includes(id));
      throw createError.notFound(`Products not found: ${missing.join(', ')}`);
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // Calculate totals and build items with snapshots
    let totalQuantity = 0;
    let totalAmount = 0;

    const itemsData = input.items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId) as any;
      const lineTotal = Number(product.unitPrice) * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += lineTotal;

      return {
        productId: item.productId,
        snapshotName: product.name,
        snapshotSku: product.sku,
        snapshotUnitPrice: product.unitPrice,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const challanNumber = await generateChallanNumber();

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        customerId: input.customerId,
        status: ChallanStatus.DRAFT,
        totalQuantity,
        totalAmount,
        notes: input.notes || null,
        createdById: userId,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    return challan;
  },

  async confirm(id: string, userId: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) throw createError.notFound('Challan');

    if (challan.status !== ChallanStatus.DRAFT) {
      throw createError.businessRule(
        `Cannot confirm challan with status '${challan.status}'. Only DRAFT challans can be confirmed.`
      );
    }

    // Pre-validate all stock BEFORE starting the transaction
    const productIds = challan.items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    const stockErrors: Array<{
      productId: string;
      productName: string;
      productSku: string;
      available: number;
      requested: number;
    }> = [];

    for (const item of challan.items) {
      const product = productMap.get((item as any).productId) as any;
      if (!product) {
        throw createError.notFound(`Product with ID ${(item as any).productId} no longer exists`);
      }
      if (product.stock < (item as any).quantity) {
        stockErrors.push({
          productId: product.id,
          productName: (item as any).snapshotName,
          productSku: (item as any).snapshotSku,
          available: product.stock,
          requested: (item as any).quantity,
        });
      }
    }

    if (stockErrors.length > 0) {
      throw createError.insufficientStock(stockErrors);
    }

    // All stock validated — run the atomic transaction
    const confirmedChallan = await prisma.$transaction(async (tx: any) => {
      // Deduct stock and create OUT movements for each item
      for (const item of challan.items) {
        const i = item as any;
        await tx.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: i.productId,
            quantity: i.quantity,
            movementType: MovementType.OUT,
            reason: `Challan ${challan.challanNumber} confirmed`,
            referenceId: challan.id,
            createdById: userId,
          },
        });
      }

      // Update challan status
      const updated = await tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, stock: true } },
            },
          },
        },
      });

      return updated;
    });

    return confirmedChallan;
  },

  async cancel(id: string, _input: CancelChallanInput) {
    const challan = await prisma.challan.findUnique({ where: { id } });
    if (!challan) throw createError.notFound('Challan');

    if (challan.status !== ChallanStatus.DRAFT) {
      throw createError.businessRule(
        `Cannot cancel challan with status '${challan.status}'. Only DRAFT challans can be cancelled.`
      );
    }

    const updated = await prisma.challan.update({
      where: { id },
      data: {
        status: ChallanStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return updated;
  },
};
