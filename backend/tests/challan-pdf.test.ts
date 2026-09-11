// tests/challan-pdf.test.ts
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import * as pdfService from '../src/modules/challans/challans.pdf';
import {
  cleanDb,
  createTestUser,
  createTestCustomer,
  createTestProduct,
  createTestChallan,
} from './helpers';

describe('Challan PDF Export Integration Tests', () => {
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

  it('1. Authenticated PDF export returns 200, application/pdf, and valid %PDF binary magic bytes', async () => {
    const product = await createTestProduct(adminUser.id, {
      name: 'High-Pressure Hydraulic Pipe',
      sku: 'SKU-PIPE-100',
      unitPrice: 450.0,
      stock: 50,
    });

    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 3 },
    ]);

    const res = await request(app)
      .get(`/api/challans/${challan.id}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-length']).toBeDefined();

    // Verify PDF magic bytes: starts with '%PDF'
    const isBuffer = Buffer.isBuffer(res.body);
    const buffer = isBuffer ? res.body : Buffer.from(res.text, 'binary');
    const magicHeader = buffer.subarray(0, 4).toString('ascii');
    expect(magicHeader).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('2. Unauthenticated request is rejected with 401 UNAUTHORIZED', async () => {
    const product = await createTestProduct(adminUser.id);
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 1 }]);

    const res = await request(app).get(`/api/challans/${challan.id}/pdf`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('3. All authorized authenticated roles (ADMIN, SALES, WAREHOUSE, ACCOUNTS) can export PDF', async () => {
    const product = await createTestProduct(adminUser.id);
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 2 }]);

    const roles: Array<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS'> = [
      'ADMIN',
      'SALES',
      'WAREHOUSE',
      'ACCOUNTS',
    ];

    for (const role of roles) {
      const { token } = await createTestUser(role);
      const res = await request(app)
        .get(`/api/challans/${challan.id}/pdf`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    }
  });

  it('4. Nonexistent challan returns 404 NOT_FOUND', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app)
      .get(`/api/challans/${nonExistentId}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('5. Response contains sanitized Content-Disposition with the actual challan number', async () => {
    const product = await createTestProduct(adminUser.id);
    const challan = await createTestChallan(adminUser.id, customer.id, [{ product, quantity: 5 }]);

    const res = await request(app)
      .get(`/api/challans/${challan.id}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const contentDisposition = res.headers['content-disposition'];
    expect(contentDisposition).toBeDefined();

    const expectedFilename = `${challan.challanNumber.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
    expect(contentDisposition).toContain(`attachment; filename="${expectedFilename}"`);
  });

  it('6. Snapshot Integrity: PDF export preserves historical snapshots when product catalog is modified', async () => {
    const historicalName = 'Legacy Brass Compression Fitting';
    const historicalSku = 'SKU-BRASS-HIST-01';
    const historicalPrice = 120.0;

    const product = await createTestProduct(adminUser.id, {
      name: historicalName,
      sku: historicalSku,
      unitPrice: historicalPrice,
      stock: 40,
    });

    const challan = await createTestChallan(adminUser.id, customer.id, [
      { product, quantity: 4 },
    ]);

    // Mutate the product in the catalog table
    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: 'MODIFIED NEW CATALOG NAME 2026',
        sku: 'SKU-MUTATED-999',
        unitPrice: 850.0,
      },
    });

    // Spy on generateChallanPdf to assert authoritative input parameters
    const pdfSpy = jest.spyOn(pdfService, 'generateChallanPdf');

    const res = await request(app)
      .get(`/api/challans/${challan.id}/pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(pdfSpy).toHaveBeenCalledTimes(1);

    const callArgs = pdfSpy.mock.calls[0][0];
    expect(callArgs.challanNumber).toBe(challan.challanNumber);
    expect(callArgs.items).toHaveLength(1);

    // CRITICAL ASSERTION: The item snapshot passed to PDF generator contains historical values
    const passedItem = callArgs.items[0];
    expect(passedItem.snapshotName).toBe(historicalName);
    expect(passedItem.snapshotSku).toBe(historicalSku);
    expect(Number(passedItem.snapshotUnitPrice)).toBe(historicalPrice);
    expect(passedItem.snapshotName).not.toBe('MODIFIED NEW CATALOG NAME 2026');
    expect(passedItem.snapshotSku).not.toBe('SKU-MUTATED-999');

    // Verify PDF binary response is valid and non-empty
    const buffer = Buffer.isBuffer(res.body) ? res.body : Buffer.from(res.text, 'binary');
    expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);

    pdfSpy.mockRestore();
  });
});
