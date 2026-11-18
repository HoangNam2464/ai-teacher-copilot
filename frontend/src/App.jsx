import React from 'react';
import { AppRoutes } from '@/routes/AppRoutes';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import './styles/main.css';

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
