// tests/snapshots.test.ts
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import {
  cleanDb,
  createTestUser,
  createTestCustomer,
  createTestProduct,
  createTestChallan,
} from './helpers';

describe('Product Snapshot Protection Integration Tests', () => {
  let adminUser: any;
  let adminToken: string;

  beforeEach(async () => {
    await cleanDb();
    const admin = await createTestUser('ADMIN');
    adminUser = admin.user;
    adminToken = admin.token;
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('1. Challan item snapshot values remain immutable when master product catalog changes', async () => {
    const customer = await createTestCustomer(adminUser.id);
    const initialName = 'Industrial Flange 2-Inch';
    const initialSku = 'SKU-FLANGE-001';
    const initialPrice = 150.0;

    // Create original product
    const product = await createTestProduct(adminUser.id, {
      name: initialName,
      sku: initialSku,
      unitPrice: initialPrice,
      stock: 50,
    });

    // Create challan with item referencing this product
    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 5 },
    ]);

    const createdItem = challan.items[0];
    expect(createdItem.snapshotName).toBe(initialName);
    expect(createdItem.snapshotSku).toBe(initialSku);
    expect(Number(createdItem.snapshotUnitPrice)).toBe(initialPrice);

    // Modify the product catalog via API: name, unitPrice
    const updateRes = await request(app)
      .put(`/api/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Stainless Steel Flange Heavy Duty',
        unitPrice: 320.0,
      });

    expect(updateRes.status).toBe(200);

    // Verify catalog was indeed updated
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.name).toBe('Updated Stainless Steel Flange Heavy Duty');
    expect(Number(updatedProduct?.unitPrice)).toBe(320.0);

    // CRITICAL ASSERTION: The challan item snapshot in DB remains unchanged
    const challanItemInDb = await prisma.challanItem.findUnique({
      where: { id: createdItem.id },
    });

    expect(challanItemInDb?.snapshotName).toBe(initialName);
    expect(challanItemInDb?.snapshotSku).toBe(initialSku);
    expect(Number(challanItemInDb?.snapshotUnitPrice)).toBe(initialPrice);

    // Also verify via GET /api/challans/:id endpoint
    const challanRes = await request(app)
      .get(`/api/challans/${challan.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(challanRes.status).toBe(200);
    const itemInResponse = challanRes.body.data.items[0];
    expect(itemInResponse.snapshotName).toBe(initialName);
    expect(itemInResponse.snapshotSku).toBe(initialSku);
    expect(Number(itemInResponse.snapshotUnitPrice)).toBe(initialPrice);
  });
});
