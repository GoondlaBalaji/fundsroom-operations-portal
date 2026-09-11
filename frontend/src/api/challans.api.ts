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

  downloadPdf: async (id: string, challanNumber: string): Promise<void> => {
    const response = await apiClient.get(`/challans/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    let filename = `${challanNumber || 'challan'}.pdf`;
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

