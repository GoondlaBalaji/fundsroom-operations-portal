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
    const confirmedChallan = await prisma.$transaction(async (tx: any) => {
      // 1. Load challan and verify it exists inside the transaction
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) throw createError.notFound('Challan');

      // 2. Verify status is DRAFT
      if (challan.status !== ChallanStatus.DRAFT) {
        throw createError.businessRule(
          `Cannot confirm challan with status '${challan.status}'. Only DRAFT challans can be confirmed.`
        );
      }

      // 3. Conditionally deduct stock and create OUT movements atomically
      for (const item of challan.items) {
        const i = item as any;

        // Atomic conditional decrement: Only succeeds if current on-hand stock >= requested quantity
        const result = await tx.product.updateMany({
          where: {
            id: i.productId,
            stock: { gte: i.quantity },
          },
          data: {
            stock: { decrement: i.quantity },
          },
        });

        // If count is not 1, stock was insufficient (or concurrent confirmation consumed it)
        if (result.count !== 1) {
          const currentProd = await tx.product.findUnique({
            where: { id: i.productId },
            select: { id: true, name: true, sku: true, stock: true },
          });

          const available = currentProd ? currentProd.stock : 0;
          throw createError.insufficientStock([
            {
              productId: i.productId,
              productName: i.snapshotName,
              productSku: i.snapshotSku,
              available,
              requested: i.quantity,
            },
          ]);
        }

        // Record OUT stock movement for this line item
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

      // 4. Update challan status to CONFIRMED
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
