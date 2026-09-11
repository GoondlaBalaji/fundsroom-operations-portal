// tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { cleanDb, createTestUser } from './helpers';

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('1. Valid login succeeds and returns JWT token and user profile', async () => {
    const { user } = await createTestUser('ADMIN', 'admin.login@example.com');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.login@example.com',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({
      id: user.id,
      email: 'admin.login@example.com',
      role: 'ADMIN',
    });
  });

  it('2. Invalid password is rejected with 401 UNAUTHORIZED', async () => {
    await createTestUser('SALES', 'sales.invalid@example.com');

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'sales.invalid@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('3. Missing authentication token returns 401 on protected routes', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });
});
