import React from 'react';
import { RegisterForm } from '../components/RegisterForm';
import { BrainCircuitIcon } from '../../../core/components/ui/Icons';

export function RegisterPage() {
  return (
    <div className="auth-form-wrapper">
      <div className="auth-header-centered">
        <div className="auth-logo-badge" aria-hidden="true">
          <BrainCircuitIcon size={28} />
        </div>
        <h1 className="auth-title auth-title--primary">Create Your Account</h1>
        <p className="auth-subtitle">
          Start learning smarter today. No credit card required.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
