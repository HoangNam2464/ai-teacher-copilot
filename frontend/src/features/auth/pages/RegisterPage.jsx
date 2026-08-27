import React from 'react';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  return (
    <div>
      <div className="auth-form-header">
        <h2>Đăng Ký Tài Khoản</h2>
        <p>
          Bắt đầu kiến tạo giáo án &amp; đề thi bám sát chuẩn GDPT 2018.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}

