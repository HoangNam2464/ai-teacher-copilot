import React, { useEffect, useCallback } from 'react';

/**
 * Toast — Ephemeral notification component.
 *
 * @param {string}   id         - Required. Unique ID for ARIA and key tracking.
 * @param {string}   message    - The notification message to display.
 * @param {string}   variant    - Visual style: 'success' | 'error' | 'warning' | 'info'. Default: 'info'.
 * @param {number}   duration   - Auto-dismiss duration in ms. 0 = no auto-dismiss. Default: 4000.
 * @param {function} onClose    - Callback invoked when the toast should be dismissed.
 */
export function Toast({ id, message, variant = 'info', duration = 4000, onClose }) {
  const handleClose = useCallback(() => {
    onClose?.(id);
  }, [id, onClose]);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`toast toast--${variant}`}
      id={`toast-${id}`}
    >
      <span className="toast__icon" aria-hidden="true">{icons[variant]}</span>
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={handleClose}
        aria-label="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * ToastContainer — Renders all active toasts in a fixed overlay.
 *
 * @param {Array}    toasts   - Array of toast objects: { id, message, variant, duration }.
 * @param {function} onClose  - Callback(id) invoked when any toast is dismissed.
 *
 * Usage with local state:
 *   const [toasts, setToasts] = useState([]);
 *   const addToast = (msg, variant='info') =>
 *     setToasts(p => [...p, { id: Date.now(), message: msg, variant }]);
 *   const removeToast = (id) =>
 *     setToasts(p => p.filter(t => t.id !== id));
 */
export function ToastContainer({ toasts = [], onClose }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-label="Thông báo" role="region">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
