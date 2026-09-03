import React from 'react';
import { Card } from '../../../core/components/ui/Card';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';

export function WorkspaceCard({ workspace, isActive, onSelect, onDelete }) {
  return (
    <div className="card" style={{ padding: '1.25rem', borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))', transition: 'border-color 0.2s', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {workspace.name}
          </h3>
          {workspace.description && (
            <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', marginTop: '0.25rem' }}>
              {workspace.description}
            </p>
          )}
        </div>
        {isActive && <span className="badge badge-success">Đang kích hoạt</span>}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {workspace.subject && <span className="badge badge-info">Môn: {workspace.subject}</span>}
        {workspace.gradeLevel && <span className="badge badge-neutral">Khối {workspace.gradeLevel}</span>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
        <button
          className={isActive ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
          onClick={() => onSelect(workspace)}
          disabled={isActive}
        >
          {isActive ? 'Đang chọn' : 'Chọn không gian này'}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: 'hsl(var(--destructive))' }}
          onClick={() => onDelete(workspace.id)}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
