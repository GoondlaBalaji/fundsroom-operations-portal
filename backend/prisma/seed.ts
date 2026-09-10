// prisma/seed.ts
import { PrismaClient, UserRole, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================================
  // USERS
  // ============================================================
  const passwordHash = await bcrypt.hash('Password@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fundsroom.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@fundsroom.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@fundsroom.com' },
    update: {},
    create: {
      name: 'Ravi Sales',
      email: 'sales@fundsroom.com',
      passwordHash,
      role: UserRole.SALES,
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@fundsroom.com' },
    update: {},
    create: {
      name: 'Gopal Warehouse',
      email: 'warehouse@fundsroom.com',
      passwordHash,
      role: UserRole.WAREHOUSE,
    },
  });

  const accounts = await prisma.user.upsert({
    where: { email: 'accounts@fundsroom.com' },
    update: {},
    create: {
      name: 'Priya Accounts',
      email: 'accounts@fundsroom.com',
      passwordHash,
      role: UserRole.ACCOUNTS,
    },
  });

  console.log('✅ Users seeded');

  // ============================================================
  // CUSTOMERS
  // ============================================================
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Amit Sharma',
        mobile: '9876543210',
        email: 'amit.sharma@retailco.com',
        businessName: 'Sharma Retail Store',
        customerType: CustomerType.RETAIL,
        address: '12, MG Road, Bangalore, Karnataka 560001',
        status: CustomerStatus.ACTIVE,
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdById: sales.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Suresh Mehta',
        mobile: '9876543211',
        email: 'suresh@wholesaleplus.com',
        businessName: 'Wholesale Plus Pvt Ltd',
        gstNumber: '29AABCU9603R1ZX',
        customerType: CustomerType.WHOLESALE,
        address: '45, Industrial Area, Pune, Maharashtra 411001',
        status: CustomerStatus.ACTIVE,
        createdById: sales.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Priya Distributors',
        mobile: '9876543212',
        businessName: 'Priya National Distributors',
        gstNumber: '27AAPFU0939F1ZV',
        customerType: CustomerType.DISTRIBUTOR,
        address: '78, Dharavi Industrial Estate, Mumbai, Maharashtra 400017',
        status: CustomerStatus.ACTIVE,
        createdById: admin.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Rajesh Kumar',
        mobile: '9876543213',
        email: 'rajesh.kumar@gmail.com',
        businessName: 'Kumar General Store',
        customerType: CustomerType.RETAIL,
        address: '23, Nehru Nagar, Delhi 110011',
        status: CustomerStatus.LEAD,
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        notes: 'Interested in bulk stationery orders',
        createdById: sales.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Global Tech Traders',
        mobile: '9876543214',
        email: 'info@globaltech.com',
        businessName: 'Global Tech Traders',
        gstNumber: '06AABCG0569F1ZQ',
        customerType: CustomerType.WHOLESALE,
        address: '90, Cyber City, Gurugram, Haryana 122002',
        status: CustomerStatus.ACTIVE,
        createdById: admin.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Lakshmi Enterprises',
        mobile: '9876543215',
        businessName: 'Lakshmi Enterprises',
        customerType: CustomerType.WHOLESALE,
        address: '5, Anna Salai, Chennai, Tamil Nadu 600002',
        status: CustomerStatus.INACTIVE,
        notes: 'Account put on hold due to payment issues',
        createdById: sales.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Vijay Distribution Hub',
        mobile: '9876543216',
        email: 'vijay@vdh.co.in',
        businessName: 'Vijay Distribution Hub',
        gstNumber: '33AABCV2184R1ZF',
        customerType: CustomerType.DISTRIBUTOR,
        address: '18, SIPCOT Industrial Complex, Hosur, Tamil Nadu 635109',
        status: CustomerStatus.LEAD,
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createdById: admin.id,
      },
    }),
  ]);

  // Add follow-up notes to first customer
  await prisma.customerFollowUp.createMany({
    data: [
      {
        customerId: customers[0].id,
        note: 'Called and discussed Q3 order requirements. Interested in bulk purchase.',
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdById: sales.id,
      },
      {
        customerId: customers[0].id,
        note: 'Sent product catalog via email. Awaiting response.',
        createdById: sales.id,
      },
      {
        customerId: customers[3].id,
        note: 'Initial meeting done. Very interested in stationery bulk orders for school season.',
        createdById: sales.id,
      },
    ],
  });

  console.log('✅ Customers seeded');

  // ============================================================
  // PRODUCTS
  // ============================================================
  const products = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        name: 'Dell Monitor 24" FHD',
        sku: 'DELL-MON-24FHD',
        category: 'Electronics',
        unitPrice: 12500,
        stock: 45,
        minStockAlert: 10,
        warehouseLocation: 'A-1',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Logitech Wireless Keyboard',
        sku: 'LOG-KB-WL01',
        category: 'Electronics',
        unitPrice: 1800,
        stock: 120,
        minStockAlert: 20,
        warehouseLocation: 'A-2',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'HP LaserJet Printer',
        sku: 'HP-LJ-P401',
        category: 'Electronics',
        unitPrice: 18500,
        stock: 8,
        minStockAlert: 10,   // LOW STOCK DEMO
        warehouseLocation: 'A-3',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'USB-C Hub 7-in-1',
        sku: 'USB-HUB-7C',
        category: 'Electronics',
        unitPrice: 2200,
        stock: 3,
        minStockAlert: 15,   // LOW STOCK DEMO
        warehouseLocation: 'A-4',
        createdById: warehouse.id,
      },
    }),
    // Stationery
    prisma.product.create({
      data: {
        name: 'A4 Paper Ream (500 sheets)',
        sku: 'STA-A4-500',
        category: 'Stationery',
        unitPrice: 350,
        stock: 500,
        minStockAlert: 50,
        warehouseLocation: 'B-1',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ball Pen Blue (Box of 50)',
        sku: 'STA-PEN-BLU50',
        category: 'Stationery',
        unitPrice: 250,
        stock: 200,
        minStockAlert: 30,
        warehouseLocation: 'B-2',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sticky Notes Pack (100 pcs)',
        sku: 'STA-STK-100',
        category: 'Stationery',
        unitPrice: 120,
        stock: 2,
        minStockAlert: 20,   // LOW STOCK DEMO
        warehouseLocation: 'B-3',
        createdById: warehouse.id,
      },
    }),
    // Packaging
    prisma.product.create({
      data: {
        name: 'Cardboard Box Large (25x20x15cm)',
        sku: 'PKG-BOX-LG',
        category: 'Packaging',
        unitPrice: 45,
        stock: 1000,
        minStockAlert: 100,
        warehouseLocation: 'C-1',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bubble Wrap Roll 50m',
        sku: 'PKG-BW-50M',
        category: 'Packaging',
        unitPrice: 480,
        stock: 60,
        minStockAlert: 10,
        warehouseLocation: 'C-2',
        createdById: warehouse.id,
      },
    }),
    // Hardware
    prisma.product.create({
      data: {
        name: 'Heavy Duty Shelf Bracket',
        sku: 'HW-SHF-BKT',
        category: 'Hardware',
        unitPrice: 180,
        stock: 0,
        minStockAlert: 20,   // OUT OF STOCK DEMO
        warehouseLocation: 'D-1',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Industrial Tape 50m',
        sku: 'HW-TAPE-50M',
        category: 'Hardware',
        unitPrice: 95,
        stock: 250,
        minStockAlert: 30,
        warehouseLocation: 'D-2',
        createdById: warehouse.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Weighing Scale Digital 100kg',
        sku: 'HW-SCL-100K',
        category: 'Hardware',
        unitPrice: 3500,
        stock: 12,
        minStockAlert: 5,
        warehouseLocation: 'D-3',
        createdById: warehouse.id,
      },
    }),
  ]);

  // Seed stock IN movements (initial stock loading)
  await prisma.stockMovement.createMany({
    data: products.map((p) => ({
      productId: p.id,
      quantity: p.stock + 10, // simulate initial load was higher
      movementType: MovementType.IN,
      reason: 'Initial stock loading',
      createdById: warehouse.id,
    })),
  });

  console.log('✅ Products seeded');

  // ============================================================
  // CHALLANS
  // ============================================================

  // DRAFT challan (ready to confirm with sufficient stock)
  const draftChallan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CHN-20260901-0001',
      customerId: customers[1].id, // Suresh Mehta (Wholesale)
      status: ChallanStatus.DRAFT,
      totalQuantity: 15,
      totalAmount: 16000,
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products[0].id,
            snapshotName: products[0].name,
            snapshotSku: products[0].sku,
            snapshotUnitPrice: products[0].unitPrice,
            quantity: 1,
            lineTotal: 12500,
          },
          {
            productId: products[5].id,
            snapshotName: products[5].name,
            snapshotSku: products[5].sku,
            snapshotUnitPrice: products[5].unitPrice,
            quantity: 14,
            lineTotal: 3500,
          },
        ],
      },
    },
  });

  // DRAFT challan for the INSUFFICIENT STOCK demo
  const draftChallan2 = await prisma.challan.create({
    data: {
      challanNumber: 'CHN-20260901-0002',
      customerId: customers[4].id, // Global Tech Traders
      status: ChallanStatus.DRAFT,
      totalQuantity: 10,
      totalAmount: 22000,
      notes: 'Demo: This challan has insufficient stock for USB Hub (requested: 10, available: 3)',
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products[3].id, // USB-C Hub — stock: 3, requesting 10 → WILL FAIL
            snapshotName: products[3].name,
            snapshotSku: products[3].sku,
            snapshotUnitPrice: products[3].unitPrice,
            quantity: 10,
            lineTotal: 22000,
          },
        ],
      },
    },
  });

  // CONFIRMED challan (simulate stock already reduced)
  const confirmedChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CHN-20260901-0003',
      customerId: customers[2].id, // Priya Distributors
      status: ChallanStatus.CONFIRMED,
      totalQuantity: 100,
      totalAmount: 35000,
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products[4].id, // A4 Paper
            snapshotName: 'A4 Paper Ream (500 sheets)',
            snapshotSku: 'STA-A4-500',
            snapshotUnitPrice: 350,
            quantity: 100,
            lineTotal: 35000,
          },
        ],
      },
    },
  });

  // Create corresponding OUT movement for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: products[4].id,
      quantity: 100,
      movementType: MovementType.OUT,
      reason: `Challan CHN-20260901-0003 confirmed`,
      referenceId: confirmedChallan.id,
      createdById: sales.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // CANCELLED challan
  await prisma.challan.create({
    data: {
      challanNumber: 'CHN-20260901-0004',
      customerId: customers[0].id,
      status: ChallanStatus.CANCELLED,
      totalQuantity: 5,
      totalAmount: 900,
      cancelledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products[5].id,
            snapshotName: products[5].name,
            snapshotSku: products[5].sku,
            snapshotUnitPrice: products[5].unitPrice,
            quantity: 5,
            lineTotal: 1250,
          },
        ],
      },
    },
  });

  console.log('✅ Challans seeded');
  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('📋 Test Credentials:');
  console.log('  Admin:     admin@fundsroom.com     / Password@123');
  console.log('  Sales:     sales@fundsroom.com     / Password@123');
  console.log('  Warehouse: warehouse@fundsroom.com / Password@123');
  console.log('  Accounts:  accounts@fundsroom.com  / Password@123');
  console.log('');
  console.log('🧪 Demo Scenarios:');
  console.log(`  Draft Challan (confirm OK):         ${draftChallan1.challanNumber}`);
  console.log(`  Draft Challan (insufficient stock): ${draftChallan2.challanNumber}`);
  console.log('  Low stock products: HP LaserJet, USB-C Hub, Sticky Notes, Heavy Duty Shelf Bracket');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
