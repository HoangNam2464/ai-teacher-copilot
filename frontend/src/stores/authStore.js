import { create } from 'zustand';
import { tokenStorage } from '@/services/auth';

/**
 * Authentication Store (Zustand)
 * Manages JWT access token, teacher profile, and session state.
 */
export const useAuthStore = create((set) => ({
  token: tokenStorage.getAccessToken() || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: tokenStorage.hasTokens(),

  setAuth: (token, user) => {
    tokenStorage.setTokens(token);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    tokenStorage.clearTokens();
    localStorage.removeItem('active_workspace_id');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
