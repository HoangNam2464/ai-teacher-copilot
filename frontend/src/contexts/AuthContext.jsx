import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, tokenStorage } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setAuth, logout: storeLogout } = useAuthStore();

  const refreshUser = useCallback(async () => {
    try {
      if (!tokenStorage.hasTokens()) {
        storeLogout();
        return;
      }
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser) {
        setAuth(tokenStorage.getAccessToken(), storedUser);
        return;
      }
      const userData = await authService.getCurrentUser();
      // Normalize Spring Boot response shape
      const normalizedUser = {
        id: userData.id,
        email: userData.email,
        name: userData.fullName || userData.name || userData.email,
        fullName: userData.fullName || userData.name,
        role: userData.role || 'TEACHER',
        emailVerified: userData.emailVerified ?? true,
      };
      setAuth(tokenStorage.getAccessToken(), normalizedUser);
    } catch {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!storedUser) {
        storeLogout();
      }
    }
  }, [setAuth, storeLogout]);

  useEffect(() => {
    const init = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { accessToken, refreshToken } = response.tokens || response;
    tokenStorage.setTokens(accessToken, refreshToken);
    await refreshUser();
  };

  const register = async (fullName, email, password) => {
    await authService.register(fullName, email, password);
  };

  const googleLogin = async (credential) => {
    const response = await authService.googleAuth(credential);
    const { accessToken, refreshToken } = response.tokens || response;
    tokenStorage.setTokens(accessToken, refreshToken);
    await refreshUser();
  };

  const appleLogin = async (idToken, userData) => {
    const response = await authService.appleAuth(idToken, userData?.name);
    const { accessToken, refreshToken } = response.tokens || response;
    tokenStorage.setTokens(accessToken, refreshToken);
    await refreshUser();
  };

  const logout = async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } finally {
      storeLogout();
    }
  };

  const forgotPassword = async (email) => {
    await authService.forgotPassword(email);
  };

  const resetPassword = async (token, password) => {
    await authService.resetPassword(token, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        appleLogin,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
