#!/bin/sh
set -e

echo "===================================================="
echo "🚀 Initializing Fundsroom Backend Service"
echo "===================================================="

# Sync database schema with Prisma (creates tables/enums if not present)
echo "⏳ Syncing database schema (prisma db push)..."
npx prisma db push --skip-generate

# Check if database has users; if fresh, seed demo data
echo "🔍 Checking database seed state..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(count => {
  if (count === 0) {
    console.log('🌱 Fresh database detected — seeding demo accounts, catalog products, and records...');
    try {
      require('child_process').execSync('node dist/prisma/seed.js', { stdio: 'inherit' });
      console.log('✅ Demo seed completed successfully.');
    } catch (err) {
      console.error('⚠️ Seeding failed:', err.message);
    }
  } else {
    console.log('✅ Database already initialized with ' + count + ' users — skipping seed.');
  }
  process.exit(0);
}).catch(err => {
  console.warn('⚠️ Seed check warning (will proceed):', err.message);
  process.exit(0);
});
"

echo "===================================================="
echo "🚀 Starting Fundsroom REST API on port ${PORT:-4000}"
echo "===================================================="
exec node dist/server.js
