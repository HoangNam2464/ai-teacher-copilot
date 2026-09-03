import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';

export function FocusLayout() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg-app)', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: '56px',
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(PATHS.DASHBOARD)}
        >
          ← Quay lại bảng điều khiển
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Chế độ tập trung soạn thảo
        </span>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
