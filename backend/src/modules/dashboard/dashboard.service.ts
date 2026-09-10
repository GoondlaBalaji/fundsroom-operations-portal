// src/modules/dashboard/dashboard.service.ts
import { prisma } from '../../config/database';

export const dashboardService = {
  async getStats() {
    const [
      totalCustomers,
      totalProducts,
      draftChallans,
      confirmedChallans,
      recentChallans,
      recentMovements,
      upcomingFollowUps,
      lowStockProducts,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
      prisma.challan.count({ where: { status: 'CONFIRMED' } }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next 7 days
          },
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
        select: { id: true, name: true, businessName: true, followUpDate: true, status: true },
      }),
      prisma.$queryRaw<any[]>`
        SELECT id, name, sku, stock, "minStockAlert"
        FROM products
        WHERE "isActive" = true AND stock < "minStockAlert"
        ORDER BY (stock - "minStockAlert") ASC
        LIMIT 5
      `,
    ]);

    return {
      totalCustomers,
      totalProducts,
      draftChallans,
      confirmedChallans,
      lowStockCount: lowStockProducts.length,
      recentChallans,
      recentMovements,
      upcomingFollowUps,
      lowStockProducts,
    };
  },
};
