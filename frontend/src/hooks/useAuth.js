import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();
  return { user, token, isAuthenticated, setAuth, logout };
}
