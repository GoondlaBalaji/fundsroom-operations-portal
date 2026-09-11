// tests/customers.test.ts
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

describe('Customer Detail & Linked Challans Integration Tests (FIX #2)', () => {
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

  it('1. GET /api/customers/:id returns customer with linked challans list', async () => {
    const customer = await createTestCustomer(adminUser.id);
    const product = await createTestProduct(adminUser.id, { stock: 20 });
    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 3 },
    ]);

    const res = await request(app)
      .get(`/api/customers/${customer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const customerData = res.body.data;
    expect(customerData).toHaveProperty('challans');
    expect(Array.isArray(customerData.challans)).toBe(true);
    expect(customerData.challans).toHaveLength(1);

    const linkedChallan = customerData.challans[0];
    expect(linkedChallan.id).toBe(challan.id);
    expect(linkedChallan.challanNumber).toBe(challan.challanNumber);
    expect(linkedChallan.status).toBe('DRAFT');
    expect(linkedChallan.totalQuantity).toBe(3);
    expect(Number(linkedChallan.totalAmount)).toBe(Number(challan.totalAmount));
    expect(linkedChallan).toHaveProperty('createdAt');
  });

  it('2. GET /api/customers/:id returns empty array for customer without challans', async () => {
    const customer = await createTestCustomer(adminUser.id);

    const res = await request(app)
      .get(`/api/customers/${customer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const customerData = res.body.data;
    expect(customerData).toHaveProperty('challans');
    expect(Array.isArray(customerData.challans)).toBe(true);
    expect(customerData.challans).toEqual([]);
  });
});
