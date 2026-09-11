# backend/Dockerfile
# Build Stage
FROM node:20-alpine AS builder

# Install OpenSSL required by Prisma schema engine on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build
# Pre-compile seed script to plain JavaScript for production execution
RUN npx tsc prisma/seed.ts --outDir dist/prisma --skipLibCheck --module commonjs --target es2020 --esModuleInterop

# Production Runtime Stage
FROM node:20-alpine AS runner

# Install OpenSSL required by Prisma runtime on Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
