import React from 'react';

/**
 * EmptyState — Placeholder displayed when a list or section has no content.
 *
 * @param {string}      icon        - Emoji or icon character shown at the top. Default: '📭'.
 * @param {string}      title       - Primary heading text.
 * @param {string}      description - Secondary descriptive text.
 * @param {ReactNode}   action      - Optional action element (e.g. a Button to create content).
 * @param {string}      className   - Additional class names.
 *
 * Example:
 *   <EmptyState
 *     icon="📄"
 *     title="Chưa có tài liệu nào"
 *     description="Tải lên tài liệu đầu tiên để bắt đầu xây dựng kho tri thức."
 *     action={<Button onClick={handleUpload}>Tải tài liệu lên</Button>}
 *   />
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`} role="status" aria-live="polite">
      <span className="empty-state__icon" aria-hidden="true">{icon}</span>
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
