// src/types/index.ts

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  _count?: { followUps: number; challans: number };
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  stock: number;
  minStockAlert: number;
  warehouseLocation?: string;
  isActive: boolean;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string };
  quantity: number;
  movementType: MovementType;
  reason: string;
  referenceId?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  product?: { id: string; name: string; sku: string; stock: number };
  snapshotName: string;
  snapshotSku: string;
  snapshotUnitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: { id: string; name: string; businessName: string; mobile?: string };
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount: number;
  notes?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: ChallanItem[];
  _count?: { items: number };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  draftChallans: number;
  confirmedChallans: number;
  lowStockCount: number;
  recentChallans: Challan[];
  recentMovements: StockMovement[];
  upcomingFollowUps: Customer[];
  lowStockProducts: Product[];
}
