import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h1>
        <p className="text-sm text-muted-foreground">
          Đăng nhập vào tài khoản để truy cập Workspace của bạn
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
