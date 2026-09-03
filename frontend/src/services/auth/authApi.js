import apiClient from '@/services/core/client';
import { ENDPOINTS } from '@/services/core/endpoints';

export const authApi = {
  async login(email, password) {
    const response = await apiClient.post(ENDPOINTS.AUTH_LOGIN, { email, password });
    return response.data?.data || response.data;
  },

  async register(email, password, fullName) {
    const response = await apiClient.post(ENDPOINTS.AUTH_REGISTER, { email, password, fullName });
    return response.data?.data || response.data;
  },
};
