import React from 'react';

export function Spinner({ size = 'md', message = 'Đang tải...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.5rem' }}>
      <div style={{ fontSize: size === 'sm' ? '1.25rem' : size === 'lg' ? '2.5rem' : '1.75rem', animation: 'spin 1s linear infinite' }}>
        ⏳
      </div>
      {message && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{message}</p>}
    </div>
  );
}
