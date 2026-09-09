import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { PATHS } from '@/routes/paths';

/**
 * Route Guard checking user authentication.
 * Shows full-page spinner while auth state is initializing.
 * Redirects unauthenticated teachers to /login.
 */
export function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return children;
}
