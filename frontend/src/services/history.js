import api from './api';
import { ENDPOINTS } from '@/config/api';

export const historyService = {
  async getHistory(workspaceId) {
    const response = await api.get(ENDPOINTS.history.list(workspaceId));
    return response.data;
  },

  async getHistoryItem(id) {
    const response = await api.get(ENDPOINTS.history.get(id));
    return response.data;
  },

  async deleteHistoryItem(id) {
    const response = await api.delete(ENDPOINTS.history.delete(id));
    return response.data;
  },
};

export const historyApi = historyService;
