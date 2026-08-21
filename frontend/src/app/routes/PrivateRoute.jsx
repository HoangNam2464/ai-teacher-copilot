import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../core/hooks/useAuth';
import { PATHS } from './paths';

export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return children;
}
