import api from './api';
import { ENDPOINTS } from '@/config/api';

export const authService = {
  // Email/Password Auth
  async login(email, password) {
    const response = await api.post(ENDPOINTS.auth.login, { email, password });
    return response.data;
  },

  async register(fullName, email, password) {
    const response = await api.post(ENDPOINTS.auth.register, { fullName, email, password });
    return response.data;
  },

  async logout(refreshToken) {
    try {
      await api.post(ENDPOINTS.auth.logout, { refreshToken });
    } catch {
      // Best effort logout
    }
  },

  async refreshToken(refreshToken) {
    const response = await api.post(ENDPOINTS.auth.refresh, { refreshToken });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get(ENDPOINTS.auth.me);
    return response.data;
  },

  // OAuth (Google & Apple)
  async googleAuth(credential) {
    const response = await api.post(ENDPOINTS.auth.google, { credential });
    return response.data;
  },

  async appleAuth(idToken, fullName) {
    const response = await api.post(ENDPOINTS.auth.apple, { idToken, fullName });
    return response.data;
  },

  // Password Reset
  async forgotPassword(email) {
    const response = await api.post(ENDPOINTS.auth.forgotPassword, { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post(ENDPOINTS.auth.resetPassword, { token, newPassword });
    return response.data;
  },

  // Email Verification
  async verifyEmail(token) {
    const response = await api.post(ENDPOINTS.auth.verifyEmail, { token });
    return response.data;
  },

  async resendVerification(email) {
    const response = await api.post(ENDPOINTS.auth.resendVerification, { email });
    return response.data;
  },
};

// Token & User storage helpers matching frontend1
export const tokenStorage = {
  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  getAccessToken() {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  },

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  hasTokens() {
    return !!(localStorage.getItem('token') || localStorage.getItem('accessToken'));
  },
};

// Backwards compatibility alias
export const authApi = authService;
