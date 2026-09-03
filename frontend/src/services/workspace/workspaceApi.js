import apiClient from '@/services/core/client';
import { ENDPOINTS } from '@/services/core/endpoints';

export const workspaceApi = {
  async getWorkspaces() {
    const response = await apiClient.get(ENDPOINTS.WORKSPACES);
    return response.data;
  },

  async createWorkspace(data) {
    const response = await apiClient.post(ENDPOINTS.WORKSPACES, data);
    return response.data;
  },

  async deleteWorkspace(id) {
    const response = await apiClient.delete(ENDPOINTS.WORKSPACE_BY_ID(id));
    return response.data;
  },
};
