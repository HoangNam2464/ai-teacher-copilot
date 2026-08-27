import React from 'react';
import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div>
      <div className="auth-form-header">
        <h2>Đăng Nhập Hệ Thống</h2>
        <p>
          Chào mừng Thầy/Cô quay trở lại với không gian soạn giáo án &amp; đề thi AI Copilot.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
