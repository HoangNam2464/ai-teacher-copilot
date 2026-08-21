import React from 'react';

export function Spinner({ size = 'md', message = 'Đang tải...' }) {
  const spinnerSize = size === 'sm' ? '1rem' : size === 'lg' ? '2.25rem' : '1.5rem';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.75rem' }}>
      <div
        className="spinner"
        style={{ width: spinnerSize, height: spinnerSize }}
        role="status"
        aria-label={message}
      />
      {message && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>{message}</p>}
    </div>
  );
}
