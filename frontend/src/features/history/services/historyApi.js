import apiClient from '../../../core/services/client';
import { ENDPOINTS } from '../../../core/services/endpoints';

export const historyApi = {
  async getHistory(workspaceId) {
    const response = await apiClient.get(ENDPOINTS.GENERATION_HISTORY(workspaceId));
    return response.data;
  },

  async getHistoryItem(workspaceId, id) {
    const response = await apiClient.get(ENDPOINTS.GENERATION_BY_ID(workspaceId, id));
    return response.data;
  },

  async updateItem(workspaceId, id, data) {
    const response = await apiClient.put(ENDPOINTS.GENERATION_BY_ID(workspaceId, id), data);
    return response.data;
  },

  async regenerate(workspaceId, id, instructions) {
    const response = await apiClient.post(ENDPOINTS.GENERATION_REGENERATE(workspaceId, id), { instructions });
    return response.data;
  },
};
