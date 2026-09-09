import api from './api';
import { ENDPOINTS } from '@/config/api';

export const workspaceService = {
  async getWorkspaces() {
    const response = await api.get(ENDPOINTS.workspaces.list);
    return response.data;
  },

  async createWorkspace(data) {
    const response = await api.post(ENDPOINTS.workspaces.create, data);
    return response.data;
  },

  async deleteWorkspace(id) {
    const response = await api.delete(ENDPOINTS.workspaces.delete(id));
    return response.data;
  },
};

export const workspaceApi = workspaceService;
