// src/api/dashboard.api.ts
import { apiClient } from './client';

export const dashboardApi = {
  getStats: () =>
    apiClient.get('/dashboard/stats').then((r) => r.data.data),
};
