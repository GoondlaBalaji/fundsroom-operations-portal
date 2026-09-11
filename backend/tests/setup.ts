// tests/setup.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres@127.0.0.1:5434/fundsroom_test_db?schema=public';
process.env.JWT_SECRET = 'test-super-secret-jwt-key-fundsroom';
process.env.PORT = '4001';
process.env.FRONTEND_URL = 'http://localhost:5173';
