// src/api/auth.api.ts
import { apiClient } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data.data),

  getMe: () =>
    apiClient.get('/auth/me').then((r) => r.data.data),
};
