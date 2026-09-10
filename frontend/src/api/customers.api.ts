// src/api/customers.api.ts
import { apiClient } from './client';

export const customersApi = {
  list: (params?: Record<string, any>) =>
    apiClient.get('/customers', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/customers/${id}`).then((r) => r.data.data),

  create: (data: any) =>
    apiClient.post('/customers', data).then((r) => r.data.data),

  update: (id: string, data: any) =>
    apiClient.put(`/customers/${id}`, data).then((r) => r.data.data),

  getFollowUps: (id: string) =>
    apiClient.get(`/customers/${id}/follow-ups`).then((r) => r.data.data),

  addFollowUp: (id: string, data: any) =>
    apiClient.post(`/customers/${id}/follow-ups`, data).then((r) => r.data.data),
};
