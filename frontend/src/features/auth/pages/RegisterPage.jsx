import React from 'react';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', textAlign: 'center' }}>
        Đăng Ký Tài Khoản
      </h2>
      <RegisterForm />
    </div>
  );
}
