import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { BrainCircuitIcon } from '../../../core/components/ui/Icons';

export function LoginPage() {
  return (
    <div className="auth-form-wrapper">
      <div className="auth-header-centered">
        <div className="auth-logo-badge" aria-hidden="true">
          <BrainCircuitIcon size={28} />
        </div>
        <h1 className="auth-title auth-title--primary">Welcome Back</h1>
        <p className="auth-subtitle">
          Sign in to your account to access your workspaces.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
