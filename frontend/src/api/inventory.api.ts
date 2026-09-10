// src/api/inventory.api.ts
import { apiClient } from './client';

export const inventoryApi = {
  listMovements: (params?: Record<string, any>) =>
    apiClient.get('/inventory/movements', { params }).then((r) => r.data),

  createInMovement: (data: any) =>
    apiClient.post('/inventory/movements', data).then((r) => r.data.data),

  getLowStock: () =>
    apiClient.get('/inventory/low-stock').then((r) => r.data.data),
};
