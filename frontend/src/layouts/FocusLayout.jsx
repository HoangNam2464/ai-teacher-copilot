import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/routes/paths';

export function FocusLayout() {
  const { t } = useTranslation();
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
          onClick={() => navigate(PATHS.WORKSPACES)}
        >
          {t('common.backToDashboard')}
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {t('common.focusMode')}
        </span>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
