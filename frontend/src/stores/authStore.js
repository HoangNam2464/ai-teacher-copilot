import { create } from 'zustand';
import { tokenStorage } from '@/services/auth';
import { useWorkspaceStore } from '@/stores/workspaceStore';

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
    // Cleanly reset workspace store on login/switch to prevent cross-account cache leaks
    try {
      useWorkspaceStore.getState().reset();
    } catch {
      // safe fallback
    }
    set({ token, user, isAuthenticated: true });
  },

  updateUser: (updatedFields) => {
    set((state) => {
      const newUser = { ...(state.user || {}), ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },

  logout: () => {
    tokenStorage.clearTokens();
    localStorage.removeItem('active_workspace_id');
    localStorage.removeItem('onboarding_completed');
    try {
      useWorkspaceStore.getState().reset();
    } catch {
      // safe fallback
    }
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
