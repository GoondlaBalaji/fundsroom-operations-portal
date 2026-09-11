// tests/helpers.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/config/database';
import { config } from '../src/config/env';
import { UserRole, CustomerType, CustomerStatus, ChallanStatus } from '../src/types/enums';

export const cleanDb = async () => {
  await prisma.challanItem.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
};

export const createTestUser = async (role: UserRole = 'ADMIN', email?: string) => {
  const userEmail = email || `test-${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@example.com`;
  const passwordHash = await bcrypt.hash('Password@123', 8);

  const user = await prisma.user.create({
    data: {
      name: `Test ${role}`,
      email: userEmail,
      passwordHash,
      role,
      isActive: true,
    },
  });

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: '1d' } as any
  );

  return { user, token };
};

export const createTestCustomer = async (createdById: string) => {
  return prisma.customer.create({
    data: {
      name: 'Test Customer',
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: 'customer@example.com',
      businessName: 'Acme Corp Test',
      gstNumber: '29ABCDE1234F1Z5',
      customerType: CustomerType.WHOLESALE,
      address: '123 Test Street, Industrial Zone',
      status: CustomerStatus.ACTIVE,
      createdById,
    },
  });
};

export const createTestProduct = async (
  createdById: string,
  overrides?: { stock?: number; unitPrice?: number; name?: string; sku?: string }
) => {
  const uniqueSku = overrides?.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  return prisma.product.create({
    data: {
      name: overrides?.name || 'Test Industrial Valve',
      sku: uniqueSku,
      category: 'Valves',
      unitPrice: overrides?.unitPrice ?? 250.0,
      stock: overrides?.stock ?? 10,
      minStockAlert: 2,
      warehouseLocation: 'Bay-A1',
      isActive: true,
      createdById,
    },
  });
};

export const createTestChallan = async (
  createdById: string,
  customerId: string,
  items: Array<{ product: any; quantity: number }>,
  status: ChallanStatus = ChallanStatus.DRAFT
) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = Math.floor(1000 + Math.random() * 9000);
  const challanNumber = `CHN-${datePart}-${seq}`;

  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmount = items.reduce(
    (acc, i) => acc + Number(i.product.unitPrice) * i.quantity,
    0
  );

  return prisma.challan.create({
    data: {
      challanNumber,
      customerId,
      status,
      totalQuantity,
      totalAmount,
      createdById,
      items: {
        create: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          snapshotName: i.product.name,
          snapshotSku: i.product.sku,
          snapshotUnitPrice: i.product.unitPrice,
          lineTotal: Number(i.product.unitPrice) * i.quantity,
        })),
      },
    },
    include: {
      items: true,
      customer: true,
    },
  });
};
