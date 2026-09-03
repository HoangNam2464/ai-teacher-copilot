import React from 'react';

export function CitationDrawer({ isOpen, onClose, citations = [] }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--color-bg-surface)',
          height: '100%',
          boxShadow: 'var(--shadow-xl)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Nguồn Trích Dẫn Học Liệu
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {citations.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Không có nguồn trích dẫn nào.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {citations.map((c, index) => (
              <div
                key={c.chunkId || index}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                    📄 {c.fileName || 'Tài liệu nguồn'}
                  </span>
                  {c.sourcePage && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Trang {c.sourcePage}
                    </span>
                  )}
                </div>
                {c.excerpt && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    "{c.excerpt}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
