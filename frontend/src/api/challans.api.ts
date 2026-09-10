// src/api/challans.api.ts
import { apiClient } from './client';

export const challansApi = {
  list: (params?: Record<string, any>) =>
    apiClient.get('/challans', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get(`/challans/${id}`).then((r) => r.data.data),

  create: (data: any) =>
    apiClient.post('/challans', data).then((r) => r.data.data),

  confirm: (id: string) =>
    apiClient.post(`/challans/${id}/confirm`).then((r) => r.data.data),

  cancel: (id: string, data?: any) =>
    apiClient.post(`/challans/${id}/cancel`, data || {}).then((r) => r.data.data),
};
