import React from 'react';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';
import { ExportDropdown } from '../../../core/components/export/ExportDropdown';
import { formatDate } from '../../../core/utils/formatters';
import {
  IconFileText,
  IconTarget,
  IconClock,
  IconInfo,
} from '../../../core/components/icons/SvgIcons';

function getStatusBadge(status) {
  if (!status) {
    return <span style={{ color: 'var(--color-text-muted)' }}>—</span>;
  }
  const s = String(status).toUpperCase();
  switch (s) {
    case 'APPROVED':
      return <Badge variant="success">Đã duyệt</Badge>;
    case 'REVIEWED':
      return <Badge variant="info">Đã kiểm tra</Badge>;
    case 'DRAFT':
      return <Badge variant="neutral">Bản nháp</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function HistoryRow({ item, workspaceId, onViewDetail }) {
  const isLessonPlan = item.contentType === 'LESSON_PLAN';

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--color-border)',
        transition: 'background-color var(--transition-fast)',
      }}
    >
      {/* 1. Title & Type Icon */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isLessonPlan ? 'var(--color-primary-light)' : 'rgba(124, 58, 237, 0.1)',
              color: isLessonPlan ? 'var(--color-primary)' : '#7C3AED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isLessonPlan ? <IconFileText size={18} /> : <IconTarget size={18} />}
          </span>

          <div style={{ overflow: 'hidden' }}>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                display: 'block',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
              }}
              title={item.title || 'Bài soạn không tên'}
            >
              {item.title || 'Bài soạn không tên'}
            </span>
            {(item.topic || item.subject || item.gradeLevel) && (
              <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
                {item.topic ? `Chủ đề: ${item.topic}` : ''}
                {item.subject ? ` • ${item.subject}` : ''}
                {item.gradeLevel ? ` • ${item.gradeLevel}` : ''}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 2. Content Type */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <Badge variant={isLessonPlan ? 'primary' : 'info'} style={{ fontSize: 'var(--font-size-2xs)' }}>
          {isLessonPlan ? 'Giáo án' : 'Đề thi / Quiz'}
        </Badge>
      </td>

      {/* 3. Version (only if present) */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        {item.version !== undefined && item.version !== null ? (
          <Badge variant="neutral" style={{ fontSize: 'var(--font-size-2xs)' }}>
            v{item.version}
          </Badge>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>—</span>
        )}
      </td>

      {/* 4. Review Status (only if present) */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        {getStatusBadge(item.reviewStatus)}
      </td>

      {/* 5. Created At */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconClock size={12} style={{ color: 'var(--color-text-muted)' }} />
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </td>

      {/* 6. Action Group */}
      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onViewDetail(item)}
            icon={<IconInfo size={13} />}
            title="Xem lại nội dung bài soạn"
          >
            Chi tiết
          </Button>

          {workspaceId && item.id && (
            <ExportDropdown
              workspaceId={workspaceId}
              generationId={item.id}
              defaultFileName={item.title || (isLessonPlan ? 'giao-an' : 'de-thi')}
            />
          )}
        </div>
      </td>
    </tr>
  );
}
