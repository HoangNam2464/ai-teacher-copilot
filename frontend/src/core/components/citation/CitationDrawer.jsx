import React, { useEffect } from 'react';
import { IconClose, IconFileText, IconBookOpen } from '../icons/SvgIcons';

export function CitationDrawer({ isOpen, onClose, citations = [] }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(2px)',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-drawer-title"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--color-bg-surface)',
          height: '100%',
          boxShadow: 'var(--shadow-xl)',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <div
          style={{
            padding: 'var(--space-4) var(--space-6)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--color-bg-surface)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
              <IconBookOpen size={20} />
            </span>
            <h3
              id="citation-drawer-title"
              style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}
            >
              Nguồn Trích Dẫn Học Liệu
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
            aria-label="Đóng"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {citations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
              <IconBookOpen size={36} className="text-muted" style={{ margin: '0 auto var(--space-2)', opacity: 0.5 }} />
              <p style={{ fontSize: 'var(--font-size-sm)' }}>Không có nguồn trích dẫn nào được ghi nhận cho phần nội dung này.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-normal)' }}>
                Dưới đây là các đoạn văn bản trích xuất thực tế từ tài liệu nguồn của Thầy/Cô phục vụ quá trình sinh bài:
              </p>
              {citations.map((c, index) => (
                <div
                  key={c.chunkId || index}
                  style={{
                    padding: 'var(--space-4)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-bg-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1-5)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <IconFileText size={15} />
                      {c.fileName || 'Tài liệu nguồn'}
                    </span>
                    {c.sourcePage && (
                      <span className="badge badge-neutral" style={{ fontSize: 'var(--font-size-2xs)' }}>
                        Trang {c.sourcePage}
                      </span>
                    )}
                  </div>

                  {c.excerpt && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 'var(--line-height-relaxed)',
                        fontStyle: 'italic',
                        backgroundColor: 'var(--color-bg-surface)',
                        padding: 'var(--space-2-5)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      "{c.excerpt}"
                    </p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
