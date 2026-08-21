import React from 'react';
import { Card } from '../../../core/components/ui/Card';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';
import { formatDate } from '../../../core/utils/formatters';
import {
  IconSchool,
  IconCheck,
  IconEdit,
  IconTrash,
  IconClock,
} from '../../../core/components/icons/SvgIcons';

export function WorkspaceCard({ workspace, isActive = false, onSelect, onEdit, onDelete }) {
  return (
    <Card
      hoverable
      style={{
        borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: isActive ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div>
        {/* Card Header: Icon, Name & Active Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', flex: 1, minWidth: 0 }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <IconSchool size={18} />
            </span>

            <div style={{ overflow: 'hidden', flex: 1 }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                title={workspace.name}
              >
                {workspace.name}
              </h3>
              {workspace.description && (
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px',
                    marginBottom: 0,
                    lineHeight: 'var(--line-height-normal)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={workspace.description}
                >
                  {workspace.description}
                </p>
              )}
            </div>
          </div>

          {isActive && (
            <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontSize: 'var(--font-size-2xs)' }}>
              <IconCheck size={12} />
              <span>Đang kích hoạt</span>
            </Badge>
          )}
        </div>

        {/* Subject & Grade Level Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)', margin: 'var(--space-3) 0' }}>
          {workspace.subject && (
            <Badge variant="primary" style={{ fontSize: 'var(--font-size-2xs)' }}>
              Môn: {workspace.subject}
            </Badge>
          )}
          {workspace.gradeLevel && (
            <Badge variant="neutral" style={{ fontSize: 'var(--font-size-2xs)' }}>
              Khối: {workspace.gradeLevel}
            </Badge>
          )}
        </div>
      </div>

      {/* Card Footer: Metadata & Actions */}
      <div
        style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-2xs)',
            fontFamily: 'var(--font-family-mono)',
            color: 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <IconClock size={12} />
          <span>{formatDate(workspace.createdAt)}</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
          {onEdit && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onEdit(workspace)}
              icon={<IconEdit size={13} />}
              title="Chỉnh sửa thông tin không gian"
            >
              Sửa
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDelete(workspace)}
              icon={<IconTrash size={13} />}
              className="text-danger"
              title="Xóa không gian làm việc này"
            >
              Xóa
            </Button>
          )}

          <Button
            variant={isActive ? 'secondary' : 'primary'}
            size="xs"
            onClick={() => onSelect(workspace)}
            disabled={isActive}
          >
            {isActive ? 'Đang chọn' : 'Chọn'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
