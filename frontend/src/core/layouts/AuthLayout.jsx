import React from 'react';
import { Outlet } from 'react-router-dom';
import { IconGraduationCap } from '../components/icons/SvgIcons';

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <IconGraduationCap size={28} />
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            AI Teacher Copilot
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Trợ lý AI soạn học liệu cho giáo viên K-12
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
