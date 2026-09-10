// src/api/products.api.ts
import { apiClient } from './client';

export const productsApi = {
  list: (params?: Record<string, any>) =>
    apiClient.get('/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/products/${id}`).then((r) => r.data.data),

  create: (data: any) =>
    apiClient.post('/products', data).then((r) => r.data.data),

  update: (id: string, data: any) =>
    apiClient.put(`/products/${id}`, data).then((r) => r.data.data),

  getCategories: () =>
    apiClient.get('/products/categories').then((r) => r.data.data),
};
