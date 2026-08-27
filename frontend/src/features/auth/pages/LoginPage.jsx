import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', textAlign: 'center' }}>
        Đăng Nhập
      </h2>
      <LoginForm />
    </div>
  );
}
