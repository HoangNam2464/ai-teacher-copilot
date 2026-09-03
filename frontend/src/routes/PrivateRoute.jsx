import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PATHS } from '@/routes/paths';

/**
 * Route Guard checking user authentication.
 * Redirects unauthenticated teachers to /login.
 */
export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return children;
}
