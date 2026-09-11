// tests/product-image.test.ts
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { s3Client } from '../src/services/s3.service';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { cleanDb, createTestUser, createTestProduct } from './helpers';

// Helpers to construct realistic test image buffers
const createValidPngBuffer = (size = 1024): Buffer => {
  const buf = Buffer.alloc(size, 0);
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const header = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
  for (let i = 0; i < header.length; i++) {
    buf[i] = header[i];
  }
  return buf;
};

const createValidJpegBuffer = (size = 1024): Buffer => {
  const buf = Buffer.alloc(size, 0);
  // JPEG signature: FF D8 FF
  const header = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
  for (let i = 0; i < header.length; i++) {
    buf[i] = header[i];
  }
  return buf;
};

describe('Product Image S3 Integration Tests', () => {
  let adminUser: any;
  let adminToken: string;
  let warehouseUser: any;
  let warehouseToken: string;
  let salesToken: string;
  let accountsToken: string;
  let s3SendSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Intercept S3 network requests to ensure tests are 100% offline & safe
    s3SendSpy = jest.spyOn(s3Client, 'send').mockImplementation(async (command: any) => {
      return { $metadata: { httpStatusCode: 200 } } as any;
    });
  });

  afterAll(async () => {
    s3SendSpy.mockRestore();
    await cleanDb();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    s3SendSpy.mockClear();
    await cleanDb();

    const admin = await createTestUser('ADMIN');
    adminUser = admin.user;
    adminToken = admin.token;

    const warehouse = await createTestUser('WAREHOUSE');
    warehouseUser = warehouse.user;
    warehouseToken = warehouse.token;

    const sales = await createTestUser('SALES');
    salesToken = sales.token;

    const accounts = await createTestUser('ACCOUNTS');
    accountsToken = accounts.token;
  });

  it('1. Authenticated upload: 200, S3 PutObject called, DB imageKey and imageUrl updated', async () => {
    const product = await createTestProduct(adminUser.id, {
      name: 'High Precision Gearbox',
      sku: 'SKU-GEAR-900',
    });

    const pngBuffer = createValidPngBuffer(2048);

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', pngBuffer, { filename: 'gearbox.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imageKey).toMatch(new RegExp(`^products/${product.id}/[a-f0-9\\-]+\\.png$`));
    expect(res.body.data.imageUrl).toBeDefined();

    // Verify S3 PutObject was called
    expect(s3SendSpy).toHaveBeenCalledTimes(1);
    const sentCommand = s3SendSpy.mock.calls[0][0];
    expect(sentCommand).toBeInstanceOf(PutObjectCommand);
    expect(sentCommand.input.Key).toBe(res.body.data.imageKey);
    expect(sentCommand.input.ContentType).toBe('image/png');

    // Verify database record has durable imageKey
    const dbProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(dbProduct?.imageKey).toBe(res.body.data.imageKey);
    expect(dbProduct?.imageUrl).toBe(res.body.data.imageUrl);
  });

  it('2. WAREHOUSE role can also upload product images', async () => {
    const product = await createTestProduct(adminUser.id, {
      name: 'Industrial Valve Part',
      sku: 'SKU-VALVE-PART',
    });

    const jpegBuffer = createValidJpegBuffer(1500);

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .attach('image', jpegBuffer, { filename: 'valve.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imageKey).toMatch(new RegExp(`^products/${product.id}/[a-f0-9\\-]+\\.jpg$`));
    expect(s3SendSpy).toHaveBeenCalledTimes(1);
  });

  it('3. Unauthenticated request is rejected with 401 UNAUTHORIZED', async () => {
    const product = await createTestProduct(adminUser.id);
    const pngBuffer = createValidPngBuffer(500);

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .attach('image', pngBuffer, { filename: 'unauth.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
    expect(s3SendSpy).not.toHaveBeenCalled();
  });

  it('4. Unauthorized roles (SALES and ACCOUNTS) receive 403 FORBIDDEN', async () => {
    const product = await createTestProduct(adminUser.id);
    const pngBuffer = createValidPngBuffer(500);

    // Test SALES
    const resSales = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${salesToken}`)
      .attach('image', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(resSales.status).toBe(403);
    expect(resSales.body.errorCode).toBe('FORBIDDEN');
    expect(s3SendSpy).not.toHaveBeenCalled();

    // Test ACCOUNTS
    const resAccounts = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${accountsToken}`)
      .attach('image', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(resAccounts.status).toBe(403);
    expect(resAccounts.body.errorCode).toBe('FORBIDDEN');
    expect(s3SendSpy).not.toHaveBeenCalled();
  });

  it('5. Invalid file type (e.g. application/pdf) returns 400 validation error and S3 is NOT called', async () => {
    const product = await createTestProduct(adminUser.id);
    const pdfBuffer = Buffer.from('%PDF-1.4 Fake PDF Content');

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', pdfBuffer, { filename: 'document.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(s3SendSpy).not.toHaveBeenCalled();
  });

  it('6. Spoofed file extension with non-image bytes is rejected by signature validation', async () => {
    const product = await createTestProduct(adminUser.id);
    const fakeImageBuffer = Buffer.from('<script>alert("malicious payload")</script>');

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', fakeImageBuffer, { filename: 'fake.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('valid image signature');
    expect(s3SendSpy).not.toHaveBeenCalled();
  });

  it('7. File exceeding 5 MB limit returns 400 and S3 upload is NOT called', async () => {
    const product = await createTestProduct(adminUser.id);
    // 5.5 MB buffer
    const largeBuffer = createValidPngBuffer(5.5 * 1024 * 1024);

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', largeBuffer, { filename: 'large.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('5 MB or smaller');
    expect(s3SendSpy).not.toHaveBeenCalled();
  });

  it('8. Nonexistent product returns 404 NOT_FOUND and S3 upload is NOT called', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const pngBuffer = createValidPngBuffer(500);

    const res = await request(app)
      .post(`/api/products/${nonExistentId}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
    expect(s3SendSpy).not.toHaveBeenCalled();
  });

  it('9. Safe image replacement: uploads new image, updates DB, safely deletes old S3 object', async () => {
    const product = await createTestProduct(adminUser.id, {
      name: 'Turbine Rotor Unit',
      sku: 'SKU-ROTOR-55',
    });

    const oldKey = `products/${product.id}/initial-uuid-1111.png`;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        imageKey: oldKey,
        imageUrl: `https://example-bucket.s3.amazonaws.com/${oldKey}`,
      },
    });

    const newJpeg = createValidJpegBuffer(2000);

    const res = await request(app)
      .post(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', newJpeg, { filename: 'new_rotor.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.data.imageKey).not.toBe(oldKey);

    // Verify DB points to new image
    const updatedDb = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedDb?.imageKey).toBe(res.body.data.imageKey);

    // Verify S3 calls: PutObject for new image, then DeleteObject for old image
    expect(s3SendSpy).toHaveBeenCalledTimes(2);
    expect(s3SendSpy.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect(s3SendSpy.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(s3SendSpy.mock.calls[1][0].input.Key).toBe(oldKey);
  });

  it('10. Controlled deletion: DELETE /api/products/:id/image deletes S3 object and nullifies DB fields', async () => {
    const product = await createTestProduct(adminUser.id, {
      name: 'Cast Iron Housing',
      sku: 'SKU-HOUSING-CI',
    });

    const imageKey = `products/${product.id}/to-be-deleted.png`;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        imageKey,
        imageUrl: `https://example-bucket.s3.amazonaws.com/${imageKey}`,
      },
    });

    const res = await request(app)
      .delete(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify DB cleared
    const updatedDb = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedDb?.imageKey).toBeNull();
    expect(updatedDb?.imageUrl).toBeNull();

    // Verify S3 DeleteObject was called
    expect(s3SendSpy).toHaveBeenCalledTimes(1);
    expect(s3SendSpy.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
    expect(s3SendSpy.mock.calls[0][0].input.Key).toBe(imageKey);
  });

  it('11. Idempotent deletion: DELETE /api/products/:id/image succeeds cleanly if product has no image', async () => {
    const product = await createTestProduct(adminUser.id, {
      name: 'Product Without Image',
      sku: 'SKU-NO-IMG',
    });

    const res = await request(app)
      .delete(`/api/products/${product.id}/image`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(s3SendSpy).not.toHaveBeenCalled();
  });
});
