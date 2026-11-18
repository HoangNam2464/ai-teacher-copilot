import api from './api';
import { ENDPOINTS } from '@/config/api';

export const userService = {
  async getProfile() {
    const response = await api.get(ENDPOINTS.users.me);
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.put(ENDPOINTS.users.updateProfile, data);
    return response.data;
  },

  async changePassword(oldPassword, newPassword) {
    const response = await api.put(ENDPOINTS.users.changePassword, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  async updateNotifications(notificationPreferences) {
    const response = await api.put(ENDPOINTS.users.updateNotifications, {
      notificationPreferences,
    });
    return response.data;
  },

  async updatePlan(plan) {
    const response = await api.put(ENDPOINTS.users.updatePlan, { plan });
    return response.data;
  },

  async deleteAccount() {
    const response = await api.delete(ENDPOINTS.users.deleteAccount);
    return response.data;
  },
};
