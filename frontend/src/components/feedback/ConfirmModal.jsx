import React, { useEffect, useRef } from 'react';

/**
 * ConfirmModal — Accessible confirmation dialog.
 *
 * @param {boolean}  isOpen       - Controls visibility of the modal.
 * @param {string}   title        - Modal heading text.
 * @param {string}   message      - Body text describing the action to confirm.
 * @param {string}   confirmLabel - Label for the confirm button. Default: 'Xác nhận'.
 * @param {string}   cancelLabel  - Label for the cancel button. Default: 'Hủy'.
 * @param {string}   variant      - Confirm button style: 'danger' | 'primary'. Default: 'danger'.
 * @param {boolean}  loading      - Shows loading state on confirm button. Default: false.
 * @param {function} onConfirm    - Callback invoked when user confirms.
 * @param {function} onCancel     - Callback invoked when user cancels or closes.
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  // Focus the cancel button when modal opens for safer UX
  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="modal-box">
        <h2 id="confirm-modal-title" className="modal-title">{title}</h2>
        <p id="confirm-modal-message" className="modal-message">{message}</p>
        <div className="modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-${variant}`}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
