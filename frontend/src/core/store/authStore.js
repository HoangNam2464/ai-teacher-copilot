import { create } from 'zustand';

/**
 * Authentication Store (Zustand)
 * Manages JWT access token, teacher profile, and session state.
 */
export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('token'),

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('active_workspace_id');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
