// tests/rbac.test.ts
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

describe('RBAC Integration Tests — Challan Confirmation Permissions', () => {
  let customer: any;
  let adminUser: any;

  beforeEach(async () => {
    await cleanDb();
    const admin = await createTestUser('ADMIN');
    adminUser = admin.user;
    customer = await createTestCustomer(adminUser.id);
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('1. ADMIN role can confirm a DRAFT challan', async () => {
    const product = await createTestProduct(adminUser.id, { stock: 10 });
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 2 }]);
    const { token } = await createTestUser('ADMIN');

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('2. SALES role can confirm a DRAFT challan', async () => {
    const product = await createTestProduct(adminUser.id, { stock: 10 });
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 2 }]);
    const { token } = await createTestUser('SALES');

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('3. WAREHOUSE role can confirm a DRAFT challan (verifying FIX #1 RBAC)', async () => {
    const product = await createTestProduct(adminUser.id, { stock: 10 });
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 2 }]);
    const { token } = await createTestUser('WAREHOUSE');

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('4. ACCOUNTS role is denied from confirming a DRAFT challan (403 FORBIDDEN)', async () => {
    const product = await createTestProduct(adminUser.id, { stock: 10 });
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 2 }]);
    const { token } = await createTestUser('ACCOUNTS');

    const res = await request(app)
      .post(`/api/challans/${challan.id}/confirm`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('FORBIDDEN');

    // Confirm challan remains in DRAFT status and stock was untouched
    const freshChallan = await prisma.challan.findUnique({ where: { id: challan.id } });
    expect(freshChallan?.status).toBe('DRAFT');

    const freshProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(freshProduct?.stock).toBe(10);
  });
});
