import React from 'react';
import { Link } from 'react-router-dom';
import { IconAlertTriangle, IconUpload } from '../icons/SvgIcons';
import { PATHS } from '../../../app/routes/paths';

export function InsufficientEvidenceAlert({
  message = 'Kho tri thức của không gian này chưa có đủ tài liệu liên quan để soạn nội dung theo yêu cầu.',
  onUploadClick = null,
  className = '',
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        padding: 'var(--space-4) var(--space-5)',
        backgroundColor: 'var(--color-warning-light)',
        border: '1px solid var(--color-warning-border)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-5)',
      }}
      className={className}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <span style={{ color: 'var(--color-warning)', marginTop: '2px', display: 'flex' }}>
          <IconAlertTriangle size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-warning-text)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Chưa Đủ Căn Cứ Học Liệu (Insufficient Grounding Evidence)
          </h4>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-warning-text)',
              lineHeight: 'var(--line-height-normal)',
            }}
          >
            {message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-1)' }}>
        {onUploadClick ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onUploadClick}
          >
            <IconUpload size={14} />
            <span>Nạp thêm tài liệu học liệu ngay</span>
          </button>
        ) : (
          <Link
            to={PATHS.DOCUMENTS}
            className="btn btn-secondary btn-sm"
          >
            <IconUpload size={14} />
            <span>Đi tới Kho tài liệu để nạp thêm file</span>
          </Link>
        )}
      </div>
    </div>
  );
}
