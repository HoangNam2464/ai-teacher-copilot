import React from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản mới</h1>
        <p className="text-sm text-muted-foreground">
          Bắt đầu soạn giáo án thông minh ngay hôm nay
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
