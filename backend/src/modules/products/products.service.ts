// src/modules/products/products.service.ts
import { prisma } from '../../config/database';
import { createError } from '../../utils/AppError';
import { s3Service } from '../../services/s3.service';
import type { CreateProductInput, UpdateProductInput } from './products.schema';

export const productsService = {
  async list(params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    category?: string;
    lowStock?: boolean;
  }) {
    if (params.lowStock) {
      // Use raw query — Prisma doesn't support WHERE col1 < col2
      const searchClause = params.search
        ? `AND (p.name ILIKE '%${params.search.replace(/'/g, "''")}%' OR p.sku ILIKE '%${params.search.replace(/'/g, "''")}%')`
        : '';
      const categoryClause = params.category
        ? `AND p.category ILIKE '${params.category.replace(/'/g, "''")}'`
        : '';

      const data = await prisma.$queryRawUnsafe<any[]>(`
        SELECT p.id, p.name, p.sku, p.category, p."unitPrice", p.stock, p."minStockAlert",
               p."warehouseLocation", p."imageKey", p."imageUrl", p."isActive", p."createdAt", p."updatedAt"
        FROM products p
        WHERE p."isActive" = true
        AND p.stock < p."minStockAlert"
        ${searchClause}
        ${categoryClause}
        ORDER BY (p.stock - p."minStockAlert") ASC
        LIMIT ${params.limit} OFFSET ${params.skip}
      `);

      const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
        SELECT COUNT(*)::bigint as count FROM products
        WHERE "isActive" = true AND stock < "minStockAlert"
        ${searchClause}
        ${categoryClause}
      `);

      return { data, total: Number(countResult[0].count) };
    }

    const where: any = { isActive: true };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { category: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.category) {
      where.category = { equals: params.category, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  },

  async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!product) throw createError.notFound('Product');
    return product;
  },

  async create(input: CreateProductInput, userId: string) {
    const existing = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (existing) {
      throw createError.conflict(`A product with SKU '${input.sku}' already exists`);
    }

    const product = await prisma.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        category: input.category,
        unitPrice: input.unitPrice,
        stock: input.stock ?? 0,
        minStockAlert: input.minStockAlert ?? 0,
        warehouseLocation: input.warehouseLocation || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return product;
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({ where: { id, isActive: true } });
    if (!existing) throw createError.notFound('Product');

    if (input.sku && input.sku !== existing.sku) {
      const skuConflict = await prisma.product.findUnique({ where: { sku: input.sku } });
      if (skuConflict) throw createError.conflict(`A product with SKU '${input.sku}' already exists`);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
        ...(input.minStockAlert !== undefined && { minStockAlert: input.minStockAlert }),
        ...(input.warehouseLocation !== undefined && {
          warehouseLocation: input.warehouseLocation || null,
        }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return updated;
  },

  async getCategories() {
    const categories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return categories.map((c: { category: string }) => c.category);
  },

  async uploadImage(productId: string, file: Express.Multer.File) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      throw createError.notFound('Product');
    }

    const oldImageKey = product.imageKey;

    // Upload new image to S3
    const { imageKey, imageUrl } = await s3Service.uploadProductImage(productId, file);

    // Update database record
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        imageKey,
        imageUrl,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Safely cleanup old S3 object if replacing
    if (oldImageKey && oldImageKey !== imageKey) {
      try {
        await s3Service.deleteProductImage(oldImageKey);
      } catch (err) {
        console.warn(`[S3] Failed to delete old image ${oldImageKey}:`, err);
      }
    }

    return {
      product: updated,
      imageKey,
      imageUrl,
    };
  },

  async deleteImage(productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      throw createError.notFound('Product');
    }

    if (product.imageKey) {
      await s3Service.deleteProductImage(product.imageKey);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        imageKey: null,
        imageUrl: null,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return updated;
  },
};
