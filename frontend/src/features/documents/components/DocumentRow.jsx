import React from 'react';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';
import { formatFileSize, formatDate } from '../../../core/utils/formatters';
import {
  IconFileText,
  IconFile,
  IconCheckCircle,
  IconClock,
  IconRefresh,
  IconAlertCircle,
  IconInfo,
} from '../../../core/components/icons/SvgIcons';

function getFileIcon(fileName = '') {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) {
    return <IconFileText size={18} style={{ color: 'var(--color-danger)' }} />;
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    return <IconFileText size={18} style={{ color: 'var(--color-primary)' }} />;
  }
  return <IconFile size={18} style={{ color: 'var(--color-text-secondary)' }} />;
}

function getStatusBadge(status) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'READY':
      return (
        <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-2xs)' }}>
          <IconCheckCircle size={12} />
          <span>Sẵn sàng (RAG)</span>
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-2xs)' }}>
          <IconRefresh size={12} />
          <span>Đang xử lý vector</span>
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-2xs)' }}>
          <IconAlertCircle size={12} />
          <span>Lỗi bóc tách</span>
        </Badge>
      );
    case 'PENDING':
    default:
      return (
        <Badge variant="neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-2xs)' }}>
          <IconClock size={12} />
          <span>Chờ xử lý</span>
        </Badge>
      );
  }
}

export function DocumentRow({ document: doc, onViewDetail }) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--color-border)',
        transition: 'background-color var(--transition-fast)',
      }}
    >
      {/* 1. File Name and Icon */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
          <span style={{ display: 'flex', flexShrink: 0 }}>
            {getFileIcon(doc.fileName)}
          </span>
          <div style={{ overflow: 'hidden' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)',
                display: 'block',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '320px',
              }}
              title={doc.fileName}
            >
              {doc.fileName}
            </span>
            {(doc.subject || doc.gradeLevel) && (
              <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                {doc.subject || 'Chung'} {doc.gradeLevel ? `• ${doc.gradeLevel}` : ''}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 2. File Size */}
      <td
        style={{
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-text-secondary)',
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
        }}
      >
        {formatFileSize(doc.fileSize)}
      </td>

      {/* 3. Chunk Count */}
      <td
        style={{
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-text-secondary)',
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
        }}
      >
        {typeof doc.chunkCount === 'number' && doc.chunkCount > 0 ? (
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border-subtle)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-primary)',
            }}
          >
            {doc.chunkCount} chunks
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        )}
      </td>

      {/* 4. RAG Status */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        {getStatusBadge(doc.processingStatus || doc.status)}
      </td>

      {/* 5. Uploaded Date */}
      <td
        style={{
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-text-secondary)',
          verticalAlign: 'middle',
          whiteSpace: 'nowrap',
        }}
      >
        {formatDate(doc.createdAt || doc.uploadedAt)}
      </td>

      {/* 6. Actions */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onViewDetail(doc)}
          icon={<IconInfo size={13} />}
          title="Xem chi tiết metadata tài liệu"
        >
          Chi tiết
        </Button>
      </td>
    </tr>
  );
}
