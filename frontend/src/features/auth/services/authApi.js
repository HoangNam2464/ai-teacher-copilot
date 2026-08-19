import apiClient from '../../../core/services/client';
import { ENDPOINTS } from '../../../core/services/endpoints';

export const authApi = {
  async login(email, password) {
    const response = await apiClient.post(ENDPOINTS.AUTH_LOGIN, { email, password });
    return response.data;
  },

  async register(email, password, fullName) {
    const response = await apiClient.post(ENDPOINTS.AUTH_REGISTER, { email, password, fullName });
    return response.data;
  },
};
