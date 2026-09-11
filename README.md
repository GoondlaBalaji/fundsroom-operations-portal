# 🏢 Fundsroom Mini ERP + CRM Operations Portal

[![CI / CD Pipeline](https://github.com/GoondlaBalaji/fundsroom-operations-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/GoondlaBalaji/fundsroom-operations-portal/actions/workflows/ci.yml)
[![Node.js 20](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://fundsroom-operations-portal.vercel.app)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://fundsroom-operations-portal.onrender.com)

> **Full Stack Developer Case Study** — A production-grade, role-based Wholesale & Distribution Operations Management System built with Node.js, Express, TypeScript, PostgreSQL (Prisma ORM), React 18, and Vite. Includes AWS S3, Docker, GitHub Actions CI/CD, and 33/33 automated integration tests.

---

## 🌐 Live Production URLs

| Resource | URL |
| :--- | :--- |
| **Live Frontend App** | [https://fundsroom-operations-portal.vercel.app](https://fundsroom-operations-portal.vercel.app) |
| **Live Backend API** | [https://fundsroom-operations-portal.onrender.com](https://fundsroom-operations-portal.onrender.com) |
| **API Health Check** | [https://fundsroom-operations-portal.onrender.com/health](https://fundsroom-operations-portal.onrender.com/health) |
| **API Base Path** | `https://fundsroom-operations-portal.onrender.com/api` |
| **GitHub Repository** | [https://github.com/GoondlaBalaji/fundsroom-operations-portal](https://github.com/GoondlaBalaji/fundsroom-operations-portal) |

---

## 🔑 Demo Credentials (Pre-Seeded)

Because this is an internal enterprise portal, public self-registration is intentionally omitted. The database is pre-seeded with 4 role accounts. The login page also features **1-click Quick Demo Login** buttons for each role.

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fundsroom.com` | `Password@123` | Full system access across all modules |
| **Sales** | `sales@fundsroom.com` | `Password@123` | CRM, follow-ups, draft challan creation |
| **Warehouse** | `warehouse@fundsroom.com` | `Password@123` | Product catalog, S3 images, inventory, challan confirmation |
| **Accounts** | `accounts@fundsroom.com` | `Password@123` | Read-only audit + PDF invoice export |

---

## 📌 Executive Summary

The **Fundsroom Operations Portal** is a production-grade, role-based Mini ERP + CRM system engineered for wholesale and distribution enterprises. It coordinates customer relationship management, product cataloging, stock ledger movements, and sales delivery challan fulfillment across four distinct operational roles.

### Key Engineering Highlights

- **ACID Transactional Stock Confirmations**: Delivery challan confirmation validates stock, decrements inventory, and logs outbound ledger movements atomically within a single `prisma.$transaction`, guaranteeing zero race conditions or orphaned records.
- **Negative Stock Prevention**: Database-level conditional guards block overselling under concurrent dispatch attempts, ensuring physical inventory never drops below zero.
- **Historical Product Snapshot Immutability**: Challan line items store point-in-time snapshots of product SKU, name, and unit price. Subsequent catalog edits never distort past legal dispatch or accounting records.
- **AWS S3 Cloud Storage (Bonus)**: Product images are securely stored in a private S3 bucket with magic-byte MIME validation, UUID collision-free keys, and IAM least-privilege policies.
- **Server-Side PDF Invoice Generation**: Vector PDFs are generated using `pdfkit` with full company branding, customer GSTIN, itemized snapshot tables, and signature blocks.
- **Full Production Deployment**: Vercel SPA routing rewrites, Render backend orchestration, SSL-encrypted PostgreSQL, and real AWS S3 integration — fully live and publicly accessible.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                              │
│            React 18 + Vite SPA (TypeScript + Vanilla CSS)              │
│          vercel.json SPA rewrites — all routes → index.html            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                         HTTPS (Bearer JWT)
                     CORS: fundsroom-operations-portal.vercel.app
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Render Web Service                               │
│               Node.js 20 + Express.js REST API (TypeScript)            │
│         Zod Validation ▪ JWT Auth ▪ RBAC Middleware ▪ Error Handler    │
└──────────────────┬──────────────────────────────────┬───────────────────┘
                   │                                  │
       Prisma ORM (SSL/TLS)                  AWS SDK v3 Client
       Interactive Transactions              Server-side S3 uploads
                   │                                  │
                   ▼                                  ▼
┌───────────────────────────────┐   ┌─────────────────────────────────────┐
│     Render PostgreSQL DB      │   │           Amazon Web Services        │
│  Users, Customers, Products,  │   │               AWS S3                │
│  Inventory, Challans, Items   │   │  Private Product Image Bucket        │
│  ACID Transactions/Snapshots  │   │  Block Public Access: ON             │
└───────────────────────────────┘   └─────────────────────────────────────┘
```

---

## 🗄️ Database Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Customer : "creates"
    User ||--o{ CustomerFollowUp : "logs"
    User ||--o{ Product : "creates"
    User ||--o{ StockMovement : "records"
    User ||--o{ Challan : "creates"
    Customer ||--o{ CustomerFollowUp : "has history"
    Customer ||--o{ Challan : "places"
    Product ||--o{ StockMovement : "tracks"
    Product ||--o{ ChallanItem : "referenced in"
    Challan ||--|{ ChallanItem : "contains"
    User {
        string id PK
        string name
        string email
        string passwordHash
        string role
        datetime createdAt
    }
    Customer {
        string id PK
        string name
        string mobile
        string email
        string businessName
        string gstNumber
        string customerType
        string address
        string status
        datetime followUpDate
        string notes
        string createdById FK
    }
    CustomerFollowUp {
        string id PK
        string customerId FK
        string note
        datetime followUpDate
        string createdById FK
        datetime createdAt
    }
    Product {
        string id PK
        string name
        string sku UK
        string category
        decimal unitPrice
        int stock
        int minStockAlert
        string warehouseLocation
        string imageKey
        string imageUrl
        boolean isActive
    }
    StockMovement {
        string id PK
        string productId FK
        int quantity
        string movementType
        string reason
        string referenceId
        string createdById FK
        datetime createdAt
    }
    Challan {
        string id PK
        string challanNumber UK
        string customerId FK
        string status
        int totalQuantity
        decimal totalAmount
        string notes
        datetime confirmedAt
        string createdById FK
    }
    ChallanItem {
        string id PK
        string challanId FK
        string productId FK
        string snapshotName
        string snapshotSku
        decimal snapshotUnitPrice
        int quantity
        decimal lineTotal
    }
```

---

## 👥 Role-Based Access Control (RBAC) Matrix

| Module / Operation | Admin | Sales | Warehouse | Accounts |
| :--- | :---: | :---: | :---: | :---: |
| **Dashboard KPIs & Activity** | Full | Sales Metrics | Stock Metrics | Financial Metrics |
| **Customer Directory — View** | Yes | Yes | Yes | Yes |
| **Customer Directory — Create/Edit** | Yes | Yes | No | No |
| **CRM Follow-up Notes — Add** | Yes | Yes | No | No |
| **Product Catalog — View** | Yes | Yes | Yes | Yes |
| **Product Catalog — Create/Edit** | Yes | No | Yes | No |
| **AWS S3 Product Image Upload** | Yes | No | Yes | No |
| **Receive Stock (IN Movement)** | Yes | No | Yes | No |
| **Stock Movement Ledger — View** | Full Audit | Read-only | Full Audit | Read-only |
| **Create Sales Challan (Draft)** | Yes | Yes | No | No |
| **Confirm Challan & Deduct Stock** | Yes | Yes | Yes | No |
| **Cancel Draft Challan** | Yes | Yes | No | No |
| **Export PDF Invoice** | Yes | Yes | Yes | Yes |

---

## 🔄 End-to-End Business Flow

```mermaid
sequenceDiagram
    autonumber
    actor Sales as Sales Executive
    actor Warehouse as Warehouse Manager
    actor System as Operations Portal
    Sales->>System: Add Customer and log follow-up note
    Sales->>System: Create Draft Challan with customer, products, and quantities
    Note over System: Point-in-time product snapshots locked immediately
    Warehouse->>System: Receive supplier shipment as Stock IN Movement
    Note over System: Ledger logs IN movement with PO reference and timestamp
    Warehouse->>System: Review draft challan and click Confirm Dispatch
    Note over System: ACID Transaction: Validate stock, Decrement, Record OUT, Mark CONFIRMED
    Warehouse->>System: Export official PDF delivery invoice
```

---

## 📁 Project Folder Structure

```
fundsroom-operations-portal/
├── backend/
│   ├── src/
│   │   ├── config/            # env.ts typed config and validation
│   │   ├── middleware/        # JWT auth, RBAC guard, error handler
│   │   ├── routes/            # auth, customers, products, inventory, challans, dashboard
│   │   ├── services/          # challan, s3, pdf service logic
│   │   └── utils/             # AppError, response helpers
│   ├── prisma/
│   │   ├── schema.prisma      # full relational schema
│   │   └── seed.ts            # idempotent demo data seeder
│   └── tests/                 # Jest and Supertest integration tests (33 tests)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, Header, Layout wrapper
│   │   │   └── ui/            # Pagination, ConfirmModal, Spinner
│   │   ├── context/           # AuthContext JWT and user session
│   │   ├── pages/             # Dashboard, Customers, Products, Inventory, Challans
│   │   ├── services/          # Axios API client modules
│   │   └── index.css          # Institutional design system tokens and components
│   ├── vercel.json            # SPA rewrite rules for client-side routing
│   └── nginx.conf             # Production Nginx config for Docker
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI pipeline
├── docker-compose.yml         # Full-stack multi-container setup
├── vercel.json                # Root-level SPA rewrite fallback
└── Fundsroom_Operations_Portal.postman_collection.json
```

---

## 📡 API Reference

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### Authentication

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate and issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user session |

### Dashboard

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Authenticated | KPIs, recent challans, follow-ups, low-stock alerts |

### Customers & CRM

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | Authenticated | Paginated list with search and status filter |
| `POST` | `/api/customers` | Admin, Sales | Create customer record |
| `GET` | `/api/customers/:id` | Authenticated | Customer details and follow-up timeline |
| `PUT` | `/api/customers/:id` | Admin, Sales | Update customer fields |
| `GET` | `/api/customers/:id/follow-ups` | Authenticated | Retrieve follow-up note history |
| `POST` | `/api/customers/:id/follow-ups` | Admin, Sales | Append new follow-up note |

### Product Catalog

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Authenticated | Search and filter by category or low-stock |
| `GET` | `/api/products/categories` | Authenticated | All distinct product categories |
| `POST` | `/api/products` | Admin, Warehouse | Create product with unique SKU enforcement |
| `GET` | `/api/products/:id` | Authenticated | Get product by ID |
| `PUT` | `/api/products/:id` | Admin, Warehouse | Update product metadata |
| `POST` | `/api/products/:id/image` | Admin, Warehouse | Upload product image to AWS S3 |
| `DELETE` | `/api/products/:id/image` | Admin, Warehouse | Delete image from S3 and clear DB record |

### Inventory & Stock Ledger

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory/movements` | Authenticated | Full filterable IN/OUT ledger audit log |
| `POST` | `/api/inventory/movements` | Admin, Warehouse | Record manual stock receipt as IN movement |
| `GET` | `/api/inventory/low-stock` | Authenticated | Products currently below minimum threshold |

### Sales Challans

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/challans` | Authenticated | Paginated challan list with search and status filter |
| `POST` | `/api/challans` | Admin, Sales | Create draft challan with snapshot line items |
| `GET` | `/api/challans/:id` | Authenticated | Full challan detail with items and audit trail |
| `POST` | `/api/challans/:id/confirm` | Admin, Sales, Warehouse | Validate stock, deduct inventory, mark CONFIRMED |
| `POST` | `/api/challans/:id/cancel` | Admin, Sales | Cancel draft challan |
| `GET` | `/api/challans/:id/pdf` | Authenticated | Export challan as server-side vector PDF |

---

## ☁️ AWS S3 Product Image Integration

The portal integrates AWS S3 for enterprise product image management following strict cloud security principles.

### Upload Flow

```
React Frontend
      │
      │  multipart/form-data (field: image) + Authorization: Bearer JWT
      ▼
Express Backend
      ├── Authenticate JWT and enforce RBAC (ADMIN or WAREHOUSE only)
      ├── Validate file size (5 MB maximum)
      ├── Validate MIME type and binary magic-byte inspection
      │     JPEG: FF D8 FF  |  PNG: 89 50 4E 47  |  WebP: RIFF...WEBP
      ├── Generate collision-free key: products/{productId}/{uuid}.{ext}
      └── PutObjectCommand to S3 Private Bucket
            └── Save imageKey and imageUrl to PostgreSQL via Prisma
                └── Safely delete OLD S3 object only after new DB record saved
```

### S3 Bucket CORS Policy

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "https://fundsroom-operations-portal.vercel.app",
      "http://localhost:5173"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Recommended IAM Policy (Least Privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FundsroomProductImages",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/products/*"
    }
  ]
}
```

### Backend Environment Variables for S3

```env
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=fundsroom-product-assets
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

> **Note:** If credentials are omitted, the AWS SDK falls back to IAM Instance Profiles (EC2) or ECS Task Roles automatically.

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js** v18+ (`node -v`)
- **PostgreSQL** v14+ (or Docker Desktop)
- **Git**

---

### Option A: Docker Compose (Recommended)

Runs PostgreSQL 15, Express backend, and Nginx React SPA in synchronized containers:

```bash
git clone https://github.com/GoondlaBalaji/fundsroom-operations-portal.git
cd fundsroom-operations-portal
cp .env.example .env
docker compose up --build
```

| Service | URL |
| :--- | :--- |
| Frontend Portal | `http://localhost:5173` |
| Backend REST API | `http://localhost:4000/api` |
| API Health Check | `http://localhost:4000/health` |
| PostgreSQL (host) | `localhost:5433` |

```bash
docker compose logs -f backend      # Live backend logs
docker compose down                 # Stop and preserve data
docker compose down -v              # Full reset and destroy data
```

> **Docker Auto-Seed:** On first startup, the backend detects an empty database and automatically seeds all 4 demo accounts, sample products, customers, and challans.

---

### Option B: Manual Local Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
# Starts on http://localhost:4000

# Frontend in a separate terminal
cd frontend
npm install
npm run dev
# Opens on http://localhost:5173
```

---

## 🔐 Environment Variables Reference

### Backend `.env`

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:password@localhost:5432/fundsroom_db?schema=public
JWT_SECRET=your-256-bit-secret-key-here
FRONTEND_URL=http://localhost:5173

# AWS S3 — required for product image uploads
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=fundsroom-product-assets
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:4000/api
```

### Production — Render Dashboard

| Variable | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Render PostgreSQL connection string with SSL |
| `JWT_SECRET` | 256-bit high-entropy secret |
| `FRONTEND_URL` | `https://fundsroom-operations-portal.vercel.app` |
| `AWS_REGION` | `ap-south-1` |
| `AWS_S3_BUCKET_NAME` | `fundsroom-product-assets` |
| `AWS_ACCESS_KEY_ID` | IAM least-privilege key |
| `AWS_SECRET_ACCESS_KEY` | IAM least-privilege secret |

> No production secrets are ever committed to Git.

---

## 🚢 Production Deployment Details

### Backend — Render Web Service

| Setting | Value |
| :--- | :--- |
| **Runtime** | Node.js 20 |
| **Root Directory** | `backend` |
| **Build Command** | `npm ci && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Health Check** | `/health` |
| **Auto-Deploy** | Push to `main` branch |

### Frontend — Vercel

| Setting | Value |
| :--- | :--- |
| **Framework** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **SPA Routing** | `vercel.json` rewrites all paths to `/index.html` |
| **Env Variable** | `VITE_API_URL=https://fundsroom-operations-portal.onrender.com/api` |

---

## 🧪 Automated Test Suite

```bash
cd backend
npm test
```

| Suite | Tests | Status | Coverage |
| :--- | :---: | :---: | :--- |
| **Authentication** | 3 / 3 | PASS | Valid login, bad password, missing JWT |
| **RBAC Enforcement** | 4 / 4 | PASS | All 4 roles — permission grants and 403 blocks |
| **Customer CRM** | 2 / 2 | PASS | Customer creation, follow-up timeline |
| **Challans & Stock Logic** | 6 / 6 | PASS | Draft/confirm, deduction, shortage rollback, race conditions |
| **Product Snapshots** | 1 / 1 | PASS | Snapshot immutability after catalog price change |
| **Challan PDF Export** | 6 / 6 | PASS | Binary PDF header, multi-role access, content-disposition |
| **AWS S3 Image Upload** | 11 / 11 | PASS | Magic-byte check, 5 MB limit, safe replacement, deletion |
| **Total** | **33 / 33** | **PASS** | **100% automated integration coverage** |

---

## ⚙️ GitHub Actions CI/CD Pipeline

Defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Triggers on every push and PR to `main`.

**Pipeline stages:**
1. **Backend CI** — Spins up ephemeral PostgreSQL, runs Prisma db push, executes 33 integration tests, compiles TypeScript.
2. **Frontend CI** — Runs `npm ci` and `npm run build` (tsc + vite), verifying strict type-safety and bundle output.
3. **Docker Build Validation** — Runs `docker compose build` to verify all multi-stage containers remain healthy.

**Security:** Zero production secrets required in CI. All AWS operations are mocked in tests. Concurrency cancellation enabled to save runner minutes.

---

## 📮 Postman Collection

**File:** [`Fundsroom_Operations_Portal.postman_collection.json`](./Fundsroom_Operations_Portal.postman_collection.json)

- Auto-extracts and stores `{{token}}` after running the Login request.
- Covers all positive and negative edge cases: invalid stock, duplicate SKU, role guards, insufficient auth.

---

## ✅ Feature Verification Checklist

- [x] JWT Auth & RBAC — Invalid credentials return 401; unauthorized role operations return 403
- [x] Customer CRM — Create, edit, search, status filters, append-only follow-up timeline
- [x] Product Catalog — Duplicate SKU rejected with 409; low-stock badge triggers accurately
- [x] Stock Ledger — IN movements increment stock; full paginated audit trail
- [x] Sales Challan Snapshots — Snapshot data unaffected by later price or name edits
- [x] Atomic Stock Confirmation — Shortage blocks entire transaction; success creates OUT movement atomically
- [x] PDF Invoice Export — Server-side vector PDF with snapshot data, GSTIN, and signature block
- [x] AWS S3 Integration — Magic-byte validation, 5 MB limit, UUID keys, safe replacement and deletion
- [x] Zero Secret Exposure — CI is credential-free; S3 fully mocked in tests
- [x] SPA Routing — vercel.json rewrites ensure all direct URLs and page refreshes work
- [x] Docker & CI — Multi-stage containers and full pipeline pass with zero warnings

---

## 🏗️ Key Engineering Assumptions

1. **Internal B2B Model**: Public self-registration is omitted. Users are provisioned by Admin with predefined roles.
2. **All-or-Nothing Dispatch**: If any single SKU is out of stock, the entire challan confirmation fails — no partial dispatches.
3. **Private Cloud Storage**: S3 enforces Block Public Access. Images are accessed via server-mediated tokens only.
4. **Immutable Challan Records**: Confirmed challans are append-only for legal and audit integrity.

---

## 📄 License

This project is submitted as a technical case study for the Fundsroom Full Stack Developer assessment.

**Candidate:** Balaji Goondla | **GitHub:** [GoondlaBalaji](https://github.com/GoondlaBalaji)
