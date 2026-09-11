// src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: '7d',
  frontendUrl:
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://fundsroom-operations-portal.vercel.app'
      : 'http://localhost:5173'),
  databaseUrl: process.env.DATABASE_URL as string,
  isProduction: process.env.NODE_ENV === 'production',
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    bucket: process.env.AWS_S3_BUCKET || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};
