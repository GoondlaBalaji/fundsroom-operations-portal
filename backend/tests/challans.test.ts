// tests/challans.test.ts
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

describe('Challan Confirmation & Inventory Integration Tests', () => {
  let adminUser: any;
  let adminToken: string;
  let customer: any;

  beforeEach(async () => {
    await cleanDb();
    const admin = await createTestUser('ADMIN');
    adminUser = admin.user;
    adminToken = admin.token;
    customer = await createTestCustomer(adminUser.id);
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('1. Successful challan confirmation updates stock, creates OUT movement, and confirms status', async () => {
    // Given: Product stock = 10, Challan quantity = 4, Status = DRAFT
    const product = await createTestProduct(adminUser.id, { stock: 10 });
    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 4 },
    ]);

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify in database: stock = 6
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.stock).toBe(6);

    // Verify in database: status = CONFIRMED
    const updatedChallan = await prisma.challan.findUnique({ where: { id: challan.id } });
    expect(updatedChallan?.status).toBe('CONFIRMED');
    expect(updatedChallan?.confirmedAt).not.toBeNull();

    // Verify in database: OUT movement created
    const movements = await prisma.stockMovement.findMany({
      where: { referenceId: challan.id },
    });
    expect(movements).toHaveLength(1);
    expect(movements[0].movementType).toBe('OUT');
    expect(movements[0].quantity).toBe(4);
    expect(movements[0].productId).toBe(product.id);
  });

  it('2. Insufficient stock rejects confirmation, preserves DRAFT status, and creates no OUT movement', async () => {
    // Given: Product stock = 5, Challan quantity = 8
    const product = await createTestProduct(adminUser.id, { stock: 5 });
    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 8 },
    ]);

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Verify response indicates insufficient stock
    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('INSUFFICIENT_STOCK');

    // Verify in database: stock remains 5
    const freshProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(freshProduct?.stock).toBe(5);

    // Verify in database: status remains DRAFT
    const freshChallan = await prisma.challan.findUnique({ where: { id: challan.id } });
    expect(freshChallan?.status).toBe('DRAFT');
    expect(freshChallan?.confirmedAt).toBeNull();

    // Verify in database: no OUT movements created
    const movements = await prisma.stockMovement.findMany({
      where: { referenceId: challan.id },
    });
    expect(movements).toHaveLength(0);
  });

  it('3. Atomic multi-item rollback: shortage on second item rolls back first item decrement', async () => {
    // Product A: stock = 10, requested = 8
    // Product B: stock = 5, requested = 8 (shortage)
    const productA = await createTestProduct(adminUser.id, { stock: 10, sku: 'SKU-PROD-A' });
    const productB = await createTestProduct(adminUser.id, { stock: 5, sku: 'SKU-PROD-B' });

    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product: productA, quantity: 8 },
      { product: productB, quantity: 8 },
    ]);

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('INSUFFICIENT_STOCK');

    // Verify Product A stock was NOT decremented (rolled back to 10)
    const freshProductA = await prisma.product.findUnique({ where: { id: productA.id } });
    expect(freshProductA?.stock).toBe(10);

    // Verify Product B stock remains 5
    const freshProductB = await prisma.product.findUnique({ where: { id: productB.id } });
    expect(freshProductB?.stock).toBe(5);

    // Verify challan remains DRAFT
    const freshChallan = await prisma.challan.findUnique({ where: { id: challan.id } });
    expect(freshChallan?.status).toBe('DRAFT');

    // Verify no movements recorded
    const movements = await prisma.stockMovement.findMany({
      where: { referenceId: challan.id },
    });
    expect(movements).toHaveLength(0);
  });

  it('4. Double confirmation prevention: confirmed challan cannot be confirmed again', async () => {
    const product = await createTestProduct(adminUser.id, { stock: 20 });
    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 5 },
    ]);

    // First confirmation -> SUCCESS
    const firstRes = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(firstRes.status).toBe(200);

    const stockAfterFirst = await prisma.product.findUnique({ where: { id: product.id } });
    expect(stockAfterFirst?.stock).toBe(15);

    // Second confirmation -> REJECTED
    const secondRes = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(secondRes.status).toBe(422);
    expect(secondRes.body.errorCode).toBe('BUSINESS_RULE_VIOLATION');
    expect(secondRes.body.message).toContain('Only DRAFT challans can be confirmed');

    // Stock is NOT deducted again (remains 15)
    const stockAfterSecond = await prisma.product.findUnique({ where: { id: product.id } });
    expect(stockAfterSecond?.stock).toBe(15);

    // No duplicate OUT movements (exactly 1 movement exists)
    const movements = await prisma.stockMovement.findMany({
      where: { referenceId: challan.id },
    });
    expect(movements).toHaveLength(1);
  });

  describe('Concurrency & Race-Condition Verification', () => {
    it('5. Concurrent confirmations with insufficient combined stock: prevents overselling', async () => {
      // Initial stock = 10, Challan A = 8, Challan B = 8
      const product = await createTestProduct(adminUser.id, { stock: 10 });
      const challanA = await createTestChallan(adminUser.id, customer.id, [
        { product, quantity: 8 },
      ]);
      const challanB = await createTestChallan(adminUser.id, customer.id, [
        { product, quantity: 8 },
      ]);

      // Fire both confirmation requests simultaneously
      const [resA, resB] = await Promise.all([
        request(app)
          .post(`/api/challans/${challanA.id}/confirm`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .post(`/api/challans/${challanB.id}/confirm`)
          .set('Authorization', `Bearer ${adminToken}`),
      ]);

      const statuses = [resA.status, resB.status];
      const successCount = statuses.filter((s) => s === 200).length;
      const failureCount = statuses.filter((s) => s === 422).length;

      // Exactly 1 succeeds, exactly 1 fails
      expect(successCount).toBe(1);
      expect(failureCount).toBe(1);

      // Verify final stock is exactly 2 (>= 0, never negative or oversold)
      const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(finalProduct?.stock).toBe(2);
      expect(finalProduct!.stock).toBeGreaterThanOrEqual(0);

      // Check challan statuses: one is CONFIRMED, one remains DRAFT
      const freshA = await prisma.challan.findUnique({ where: { id: challanA.id } });
      const freshB = await prisma.challan.findUnique({ where: { id: challanB.id } });
      const confirmedChallans = [freshA?.status, freshB?.status].filter(
        (s) => s === 'CONFIRMED'
      ).length;
      const draftChallans = [freshA?.status, freshB?.status].filter(
        (s) => s === 'DRAFT'
      ).length;

      expect(confirmedChallans).toBe(1);
      expect(draftChallans).toBe(1);
    });

    it('6. Concurrent confirmations within capacity: both succeed and stock is accurate', async () => {
      // Initial stock = 10, Challan A = 6, Challan B = 4
      const product = await createTestProduct(adminUser.id, { stock: 10 });
      const challanA = await createTestChallan(adminUser.id, customer.id, [
        { product, quantity: 6 },
      ]);
      const challanB = await createTestChallan(adminUser.id, customer.id, [
        { product, quantity: 4 },
      ]);

      const [resA, resB] = await Promise.all([
        request(app)
          .post(`/api/challans/${challanA.id}/confirm`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .post(`/api/challans/${challanB.id}/confirm`)
          .set('Authorization', `Bearer ${adminToken}`),
      ]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);

      // Final stock: 10 - 6 - 4 = 0
      const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
      expect(finalProduct?.stock).toBe(0);

      const freshA = await prisma.challan.findUnique({ where: { id: challanA.id } });
      const freshB = await prisma.challan.findUnique({ where: { id: challanB.id } });
      expect(freshA?.status).toBe('CONFIRMED');
      expect(freshB?.status).toBe('CONFIRMED');
    });
  });
});
