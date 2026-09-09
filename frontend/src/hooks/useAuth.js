import { useAuthStore } from '@/stores/authStore';

/**
 * useAuth hook — wraps authStore with normalized user fields
 */
export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore();

  // Normalize user display name (Spring Boot returns fullName, fallback to name or email)
  const displayName = user?.fullName || user?.name || user?.email || 'Giáo viên';
  const initials = displayName.charAt(0).toUpperCase();

  return {
    user,
    token,
    isAuthenticated,
    setAuth,
    logout,
    displayName,
    initials,
  };
}
