import apiClient from '../../../core/services/client';
import { ENDPOINTS } from '../../../core/services/endpoints';

export const historyApi = {
  async getHistory(workspaceId) {
    try {
      const response = await apiClient.get(ENDPOINTS.GENERATION_HISTORY(workspaceId));
      const data = response.data;
      return Array.isArray(data) ? data : data?.data || [];
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return [];
      }
      console.warn('History API not available or empty:', err.message);
      return [];
    }
  },

  async getHistoryItem(workspaceId, id) {
    try {
      const response = await apiClient.get(ENDPOINTS.GENERATION_BY_ID(workspaceId, id));
      return response.data?.data || response.data || null;
    } catch (err) {
      console.warn('History item detail not available:', err.message);
      return null;
    }
  },

  async updateItem(workspaceId, id, data) {
    try {
      const response = await apiClient.put(ENDPOINTS.GENERATION_BY_ID(workspaceId, id), data);
      return response.data;
    } catch (err) {
      console.warn('History item update not available:', err.message);
      return null;
    }
  },

  async regenerate(workspaceId, id, instructions) {
    try {
      const response = await apiClient.post(ENDPOINTS.GENERATION_REGENERATE(workspaceId, id), { instructions });
      return response.data;
    } catch (err) {
      console.warn('History item regenerate not available:', err.message);
      return null;
    }
  },
};
