import React from 'react';
import { IconClock, IconTrash } from '../../../core/components/icons/SvgIcons';
import { Badge } from '../../../core/components/ui/Badge';

export function ActivityTimelineItem({
  activity,
  index,
  isEditing,
  onChange,
  onDelete,
}) {
  const { title = '', duration_minutes = 10, content = '' } = activity || {};

  if (isEditing) {
    return (
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              #{index + 1}
            </span>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: 'var(--space-1-5) var(--space-3)', fontSize: 'var(--font-size-sm)' }}
              placeholder="Tên hoạt động..."
              value={title}
              onChange={(e) => onChange({ ...activity, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <input
                type="number"
                className="form-input"
                style={{ width: '64px', padding: 'var(--space-1-5) var(--space-2)', fontSize: 'var(--font-size-sm)', textAlign: 'center' }}
                min={1}
                max={120}
                value={duration_minutes}
                onChange={(e) => onChange({ ...activity, duration_minutes: Number(e.target.value) || 5 })}
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>phút</span>
            </div>

            {onDelete && (
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon text-danger"
                onClick={onDelete}
                title="Xóa hoạt động này"
                aria-label={`Xóa hoạt động ${index + 1}`}
              >
                <IconTrash size={15} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', marginBottom: '4px', fontWeight: 'var(--font-weight-medium)' }}>
            Nội dung chi tiết hoạt động:
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            style={{ fontSize: 'var(--font-size-xs)', lineHeight: 'var(--line-height-normal)' }}
            placeholder="Mô tả tiến trình hoạt động của giáo viên và học sinh..."
            value={content}
            onChange={(e) => onChange({ ...activity, content: e.target.value })}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-subtle)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-2)',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-2xs)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            #{index + 1}
          </span>
          <h4
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {title || `Hoạt động ${index + 1}`}
          </h4>
        </div>

        <Badge variant="neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--font-size-2xs)' }}>
          <IconClock size={11} />
          <span>{duration_minutes} phút</span>
        </Badge>
      </div>

      <p
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--line-height-relaxed)',
          whiteSpace: 'pre-line',
          margin: 0,
        }}
      >
        {content || 'Chưa có nội dung mô tả chi tiết.'}
      </p>
    </div>
  );
}
