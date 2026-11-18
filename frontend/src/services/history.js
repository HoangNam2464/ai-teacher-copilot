import api from './api';
import { ENDPOINTS } from '@/config/api';

export const historyService = {
  async getHistory(workspaceId) {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/generations/history`);
      return response.data?.data || response.data;
    } catch {
      const response = await api.get(ENDPOINTS.history.list(workspaceId));
      return response.data?.data || response.data;
    }
  },

  async getHistoryItem(id) {
    const response = await api.get(ENDPOINTS.history.get(id));
    return response.data?.data || response.data;
  },

  async getVersions(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}/versions`);
    return response.data?.data || response.data;
  },

  async updateReviewStatus(workspaceId, id, reviewStatus) {
    const response = await api.put(`/workspaces/${workspaceId}/generations/${id}`, {
      reviewStatus,
    });
    return response.data?.data || response.data;
  },

  async deleteHistoryItem(id) {
    const response = await api.delete(ENDPOINTS.history.delete(id));
    return response.data?.data || response.data;
  },
};

export const historyApi = historyService;
