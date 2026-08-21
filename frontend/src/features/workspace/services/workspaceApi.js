import apiClient from '../../../core/services/client';
import { ENDPOINTS } from '../../../core/services/endpoints';

export const workspaceApi = {
  async getWorkspaces() {
    const response = await apiClient.get(ENDPOINTS.WORKSPACES);
    return response.data;
  },

  async createWorkspace(data) {
    const response = await apiClient.post(ENDPOINTS.WORKSPACES, data);
    return response.data;
  },

  async updateWorkspace(id, data) {
    const response = await apiClient.put(ENDPOINTS.WORKSPACE_BY_ID(id), data);
    return response.data;
  },

  async deleteWorkspace(id) {
    const response = await apiClient.delete(ENDPOINTS.WORKSPACE_BY_ID(id));
    return response.data;
  },
};
