# 🏢 Fundsroom Mini ERP + CRM Operations Portal

[![CI / CD Pipeline](https://github.com/GoondlaBalaji/fundsroom-operations-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/GoondlaBalaji/fundsroom-operations-portal/actions/workflows/ci.yml)

> **Full Stack Developer Case Study** — Wholesale & Distribution Operations Management System built with Node.js, Express, TypeScript, PostgreSQL (Prisma ORM), React, and Vite.

---

## 📌 Executive Summary

The **Fundsroom Mini ERP + CRM Operations Portal** is an internal enterprise software application designed for wholesale and distribution companies. It streamlines the lifecycle of customer relationships, product cataloging, warehouse inventory tracking, and sales delivery challan fulfillment.

The platform provides role-tailored dashboards and permission controls for four key company roles: **Admin**, **Sales**, **Warehouse**, and **Accounts**.

### Key Architectural & Business Highlights:
- **ACID Database Transactions**: Challan confirmation verifies stock levels, decrements inventory, logs outbound ledger movements, and marks the status as `CONFIRMED` in an atomic PostgreSQL transaction with zero race conditions.
- **Strict Negative Stock Prevention**: Hard business validation blocking negative inventory before any state mutation occurs.
- **Historical Product Snapshots**: Challan items record point-in-time snapshots of product names, SKUs, and prices to ensure invoices and legal delivery documents remain immutable even if catalog prices change later.
- **Dedicated CRM Interaction Timeline**: Customer follow-up interactions are modeled as dedicated relational entities with author tracking, scheduled callback dates, and audit timestamps.
- **Enterprise Design System**: Custom dark-mode UI with intuitive KPI dashboards, responsive data tables, low-stock threshold alerts, quick demo-role switchers, and printable invoice documents.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client Tier
        UI[React 18 + Vite SPA<br/>TypeScript / Vanilla CSS Design System]
    end

    subgraph API & Application Tier
        API[Express.js + TypeScript REST API]
        Auth[JWT Authentication & RBAC Middleware]
        Val[Zod Request Validation]
        Routes[Modules: Auth, Customers, Products, Inventory, Challans, Dashboard]
    end

    subgraph Data & Persistence Tier
        Prisma[Prisma ORM]
        DB[(PostgreSQL Database)]
    end

    UI -->|HTTPS / Bearer JWT| API
    API --> Auth
    Auth --> Val
    Val --> Routes
    Routes --> Prisma
    Prisma --> DB
```

---

## 🗄️ Database Entity-Relationship (ER) Diagram

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
        enum role "ADMIN | SALES | WAREHOUSE | ACCOUNTS"
        datetime createdAt
    }

    Customer {
        string id PK
        string name
        string mobile
        string email
        string businessName
        string gstNumber
        enum customerType "RETAIL | WHOLESALE | DISTRIBUTOR"
        string address
        enum status "LEAD | ACTIVE | INACTIVE"
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
        boolean isActive
    }

    StockMovement {
        string id PK
        string productId FK
        int quantity
        enum movementType "IN | OUT"
        string reason
        string referenceId
        string createdById FK
        datetime createdAt
    }

    Challan {
        string id PK
        string challanNumber UK
        string customerId FK
        enum status "DRAFT | CONFIRMED | CANCELLED"
        int totalQuantity
        decimal totalAmount
        string notes
        datetime confirmedAt
        datetime cancelledAt
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
|---|:---:|:---:|:---:|:---:|
| **Dashboard KPIs & Activity** | Full View | Sales Metrics | Stock Metrics | Financial Metrics |
| **Customer Directory** | View / Create / Edit | View / Create / Edit | View Only | View Only |
| **CRM Follow-up Timeline** | View / Log Notes | View / Log Notes | View Only | View Only |
| **Product Catalog** | View / Create / Edit | View Only | View / Create / Edit | View Only |
| **Receive Stock (IN Movement)** | Yes | No | Yes | No |
| **Stock Movement Ledger** | Full Audit View | Read Only | Full Audit View | Read Only |
| **Create Sales Challan (Draft)** | Yes | Yes | No | No |
| **Confirm Challan & Deduct Stock** | Yes | Yes | Yes | No |
| **Cancel Draft Challan** | Yes | Yes | No | No |
| **Print / Export Delivery Challan** | Yes | Yes | Yes | Yes |

---

## 🔑 Pre-Seeded Demo Credentials

For rapid testing and evaluation, the portal includes pre-seeded accounts with quick single-click login buttons on the login screen:

| Role | Email | Password | Primary Use Case |
|---|---|---|---|
| **Admin** | `admin@fundsroom.com` | `Password@123` | Complete system access, audit logs, configuration |
| **Sales** | `sales@fundsroom.com` | `Password@123` | Customer CRM, leads, draft challan creation |
| **Warehouse**| `warehouse@fundsroom.com` | `Password@123` | Stock inward receipts, fulfillment & dispatch confirmation |
| **Accounts** | `accounts@fundsroom.com` | `Password@123` | Financial audit, customer accounts, challan records |

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **PostgreSQL**: v14.0 or higher (or Docker)
- **Git**

---

### Option A: Production-Ready Docker Compose Setup (Recommended)

Run all services (**PostgreSQL 15**, **Compiled Node.js Backend**, and **Production Nginx React SPA**) with a single command:

```bash
docker compose up --build
```
Or run in the background (detached):
```bash
docker compose up -d
```

#### Service URLs:
- **Frontend Operations Portal**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:4000/api`
- **Health Check**: `http://localhost:4000/health`
- **PostgreSQL Database**: `localhost:5433` (mapped from container `5432`)

#### Container Management Commands:
- **View Live Logs**:
  ```bash
  docker compose logs -f backend
  docker compose logs -f frontend
  ```
- **Stop Containers (Preserves DB Data Volume)**:
  ```bash
  docker compose down
  ```
- **Reset Database & Clean Volumes (Destructive)**:
  ```bash
  docker compose down -v
  docker compose up --build
  ```
  > ⚠️ **Warning**: `docker compose down -v` permanently removes the `postgres_data` volume and all stored database records.

#### Database Initialization Strategy in Docker:
The backend container runs an automated, production-grade entrypoint script (`docker-entrypoint.sh`):
1. **Schema Synchronization**: Executes `npx prisma db push` upon container startup, ensuring all tables, enums, and foreign-key relations exist.
2. **Idempotent Demo Seeding**: Checks if user records exist. If a fresh volume is detected (0 users), it automatically executes pre-compiled demo seed data (`dist/prisma/seed.js`), creating all 4 demo role accounts, sample catalog items, customers, and challans. If data already exists, seeding is safely skipped.

---

### Option B: Manual Local Setup

#### 1. Clone the repository
```bash
git clone <repository-url>
cd Fundsroom
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Verify database connection string in .env:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/fundsroom_db?schema=public"

# Run migrations and generate Prisma client
npx prisma migrate dev --name init

# Seed database with users, catalog products, customers, and movements
npm run db:seed

# Start the development server
npm run dev
```
The backend will start on **`http://localhost:4000`**. Health check: `http://localhost:4000/health`.

#### 3. Frontend Setup
Open a second terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open **`http://localhost:5173`** in your browser to launch the portal.

---

## 🔄 End-to-End Business Flow Walkthrough

```mermaid
sequenceDiagram
    autonumber
    actor Sales as Sales Exec
    actor Warehouse as Warehouse Manager
    actor System as Operations Portal

    Sales->>System: 1. Add Customer (Apex Electronics) & Record Follow-up
    Sales->>System: 2. Create Draft Sales Challan with 3 SKUs
    Note over System: Point-in-time product snapshots stored
    Warehouse->>System: 3. Receive new supplier shipment (Stock IN Movement)
    Note over System: Inventory ledger records IN movement with PO reference
    Warehouse->>System: 4. Review Draft Challan & Click "Confirm Dispatch"
    Note over System: Atomic DB Transaction: Validate Stock -> Deduct Inventory -> Record OUT Movements -> Mark Confirmed
    Warehouse->>System: 5. Print Official Delivery Challan with Receiver Sign-off
```

1. **CRM Lead to Customer**:
   - Sales team registers **Apex Electronics Ltd** under Wholesale category.
   - Logs customer interaction notes and sets scheduled follow-up reminder.
2. **Product Catalog & Stock Alert**:
   - Products are cataloged with SKU, unit price, and minimum stock threshold.
   - Low-stock items automatically highlight with danger badges when `stock <= minStockAlert`.
3. **Inbound Stock Receipt**:
   - Warehouse logs supplier PO inward via **Inventory &rarr; Receive Stock (IN)**.
   - The on-hand balance increases immediately with a timestamped audit log.
4. **Draft Challan Creation**:
   - Sales selects customer and builds multi-item dispatch lines.
   - Snapshot data (item name, SKU, price at time of order) is immutably locked.
5. **Atomic Confirmation & Dispatch**:
   - Warehouse confirms delivery. If any product stock is insufficient, transaction rolls back with a detailed warning.
   - On success, items are deducted from warehouse stock, OUT stock movements are recorded, and delivery challan is ready to print.

---

## 📡 API Reference Overview

All protected endpoints require `Authorization: Bearer <token>`.

### Authentication & Profile
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Authenticated | Fetch current user session details |

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Authenticated | KPIs, recent challans, follow-ups, low-stock |

### Customers & CRM
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Authenticated | Paginated customer list with search and filters |
| `POST` | `/api/customers` | Admin, Sales | Create customer record |
| `GET` | `/api/customers/:id` | Authenticated | Customer details, challans & follow-up timeline |
| `PUT` | `/api/customers/:id` | Admin, Sales | Update customer details |
| `GET` | `/api/customers/:id/follow-ups` | Authenticated | Retrieve follow-up notes history |
| `POST` | `/api/customers/:id/follow-ups` | Admin, Sales | Append new follow-up interaction note |

### Product Catalog
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Authenticated | Search products, filter by category/low-stock |
| `GET` | `/api/products/categories` | Authenticated | Retrieve all distinct product categories |
| `POST` | `/api/products` | Admin, Warehouse | Create product with unique SKU enforcement |
| `GET` | `/api/products/:id` | Authenticated | Get product by ID |
| `PUT` | `/api/products/:id` | Admin, Warehouse | Update product metadata |

### Inventory & Stock Ledger
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/inventory/movements` | Authenticated | Filterable audit log of all IN/OUT movements |
| `POST` | `/api/inventory/movements` | Admin, Warehouse | Record manual stock receipt (IN movement) |
| `GET` | `/api/inventory/low-stock` | Authenticated | Products below threshold level |

### Sales Challans
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/challans` | Authenticated | List challans with search and status filter |
| `POST` | `/api/challans` | Admin, Sales | Create draft challan with snapshot items |
| `GET` | `/api/challans/:id` | Authenticated | Full challan detail with line items & audit trail |
| `POST` | `/api/challans/:id/confirm` | Admin, Warehouse, Sales | Validate stock, deduct inventory, mark confirmed |
| `POST` | `/api/challans/:id/cancel` | Admin, Sales | Cancel draft challan |

---

## 📮 Postman Collection

A complete, production-ready Postman collection is included in the project root:
- **File**: [`Fundsroom_Operations_Portal.postman_collection.json`](./Fundsroom_Operations_Portal.postman_collection.json)
- **Features**:
  - Auto-extracts and sets `{{token}}` variable upon running the **Login (Admin)** request.
  - Covers all positive and negative business edge cases (e.g. invalid stock, duplicate SKU, role permission guards).

---

## ☁️ AWS & Production Deployment Guide

### Architecture Topology
- **Frontend**: AWS S3 + CloudFront CDN (or Vercel / Netlify)
- **Backend API**: AWS EC2 (t3.small with PM2 / Docker) or AWS ECS Fargate
- **Database**: AWS RDS PostgreSQL (Multi-AZ with automated backups)
- **SSL / Security**: AWS Certificate Manager (ACM) + Application Load Balancer (ALB) + AWS WAF

### Step-by-Step EC2 Deployment:
1. **Provision EC2 Instance**: Ubuntu 22.04 LTS (t3.small) within a custom VPC.
2. **Install Node.js & Docker**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx git
   sudo npm install -g pm2
   ```
3. **Configure AWS RDS PostgreSQL**:
   - Create a db.t3.micro RDS PostgreSQL instance.
   - Configure Security Groups to allow inbound port `5432` only from the EC2 security group.
4. **Deploy Backend with PM2**:
   ```bash
   git clone <repo-url> /var/www/fundsroom
   cd /var/www/fundsroom/backend
   npm ci
   npx prisma migrate deploy
   npm run build
   pm2 start dist/server.js --name "fundsroom-api"
   pm2 startup && pm2 save
   ```
5. **Nginx Reverse Proxy & SSL (Certbot)**:
   ```nginx
   server {
       listen 80;
       server_name erp.yourdomain.com;

       location /api/ {
           proxy_pass http://127.0.0.1:4000/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }

       location / {
           root /var/www/fundsroom/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   Install SSL with Let's Encrypt:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d erp.yourdomain.com
   ```

---

## 🧪 Automated Testing & QA Verification
### Running the Integration Test Suite
The project includes a comprehensive automated test suite (Jest + Supertest) testing authentication, RBAC, single & multi-item challan confirmation, atomic rollback, and concurrency race conditions against real PostgreSQL:

```bash
cd backend
npm test
# or
npm run test:integration
```
*Current result: 5 test suites, 16 tests passing, 0 failures, 0 skipped.*

---

## 🚀 Continuous Integration & Deployment (CI/CD)

The repository features an automated GitHub Actions CI/CD workflow located at [`.github/workflows/ci.yml`](.github/workflows/ci.yml) providing fast, deterministic regression testing on every push and pull request.

### Pipeline Architecture

```text
               GitHub Repository
                       │
             ┌─────────┴─────────┐
             │                   │
      Push to main/master    Pull Request
             │                   │
             └─────────┬─────────┘
                       ▼
                 GitHub Actions
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Backend CI          Frontend CI
             │                   │
     PostgreSQL (Service)   npm ci (cached)
             │                   │
     Prisma db push         npm run build (Vite)
             │
     Integration Tests (16/16)
             │
     Backend Build (tsc)
             │                   │
             └─────────┬─────────┘
                       ▼
             Docker Build Validation
            (docker compose build)
                       ▼
                  PASS / FAIL
```

### Pipeline Jobs & Verification Stages

1. **Backend CI (`backend-ci`)**:
   - **Environment**: Ubuntu Latest, Node.js 20 (`actions/setup-node` with npm caching).
   - **Ephemeral Database**: Spins up a dedicated `postgres:15-alpine` service container with automated health checks (`pg_isready`).
   - **Prisma Schema Sync**: Initializes test database schema safely using `npx prisma db push --skip-generate` without requiring fragile migrations.
   - **Integration Test Suite**: Runs Jest + Supertest (`npm test`), verifying 16 integration test cases covering RBAC, challan confirmation, atomic rollback, and concurrency locks.
   - **Production Compilation**: Executes TypeScript compiler (`npm run build`).

2. **Frontend CI (`frontend-ci`)**:
   - **Environment**: Ubuntu Latest, Node.js 20 with npm caching.
   - **Deterministic Install**: `npm ci` verifies `package-lock.json` consistency.
   - **Production Bundle**: Executes `npm run build` (`tsc -b && vite build`) ensuring strict type-safety and bundle optimization.

3. **Docker Build Validation (`docker-validation`)**:
   - Runs concurrently after backend and frontend validations pass.
   - Executes `docker compose build` to verify multi-stage Dockerfiles and container configurations remain fully functional without regressions.

### Security & Compliance
- **Least-Privilege Permissions**: Explicitly configured with read-only repository permissions (`contents: read`).
- **Zero Secret Exposure**: CI runs exclusively against ephemeral, isolated test credentials. No AWS, RDS, production credentials, or sensitive secrets are committed or required.
- **Concurrency Control**: Outdated in-flight builds on the same branch are automatically cancelled (`cancel-in-progress: true`), optimizing GitHub Actions runner minutes.

### Branch Protection Recommendation (Optional)
Repository administrators can optionally enable branch protection under **GitHub Repository Settings → Branches → Add rule for `main`**:
- Check **"Require status checks to pass before merging"**
- Require status checks: `Backend CI (Tests & Build)`, `Frontend CI (Build Verification)`, and `Docker Build Validation`.

---

## ✅ Feature Verification Checklist

- [x] **JWT Auth & RBAC**: Invalid credentials return 401; missing token returns 401; unauthorized role operations return 403.
- [x] **Customer CRM**: Creating customers, status/type filters, searching, and adding persistent follow-up timeline entries.
- [x] **Product Catalog**: Duplicate SKU creation rejected with 409 Conflict; low-stock indicators trigger accurately.
- [x] **Stock Ledger**: Inward receipts increment stock and log IN movements.
- [x] **Sales Challan Snapshot**: Line items retain snapshot values unaffected by subsequent product price updates.
- [x] **Atomic Confirmation**: Hard block if requested quantity exceeds current stock; atomic deduction and OUT movement creation upon confirmation.
- [x] **Production Builds & Docker**: Backend and frontend multi-stage container builds pass with zero warnings or errors.

---

## 📄 License
This project is submitted as part of the Fundsroom Full Stack Developer assessment.
