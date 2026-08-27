import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AuthLayout — Minimalist Centered Layout for Action Screens (Group A)
 * Eliminates visual clutter, focuses 100% on fast user authentication.
 */
export function AuthLayout() {
  return (
    <div className="auth-centered-wrapper">
      <main className="auth-centered-main">
        <div className="auth-card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
