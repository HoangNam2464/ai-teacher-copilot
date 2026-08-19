import React from 'react';
import { Card } from '../../../core/components/ui/Card';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';

export function WorkspaceCard({ workspace, isActive, onSelect, onDelete }) {
  return (
    <Card hoverable style={{ borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {workspace.name}
          </h3>
          {workspace.description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              {workspace.description}
            </p>
          )}
        </div>
        {isActive && <Badge variant="success">Đang kích hoạt</Badge>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {workspace.subject && <Badge variant="info">Môn: {workspace.subject}</Badge>}
        {workspace.gradeLevel && <Badge variant="neutral">Khối {workspace.gradeLevel}</Badge>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
        <Button
          variant={isActive ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onSelect(workspace)}
          disabled={isActive}
        >
          {isActive ? 'Đang chọn' : 'Chọn không gian này'}
        </Button>

        <button
          type="button"
          style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', cursor: 'pointer' }}
          onClick={() => onDelete(workspace.id)}
        >
          Xóa
        </button>
      </div>
    </Card>
  );
}
