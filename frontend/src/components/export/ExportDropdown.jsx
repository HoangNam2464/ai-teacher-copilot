import React, { useState } from 'react';
import { exportService } from '@/services/core/exportService';
import { Button } from '@/components/ui/Button';

export function ExportDropdown({ workspaceId, generationId, defaultFileName = 'tai-lieu' }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format) => {
    if (!workspaceId || !generationId) return;
    try {
      setIsExporting(true);
      await exportService.exportDocument(workspaceId, generationId, format, defaultFileName);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Xuất tài liệu thất bại. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        loading={isExporting}
      >
        <span>📥</span>
        <span>Xuất tài liệu</span>
        <span style={{ fontSize: '0.625rem' }}>▼</span>
      </Button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '160px',
            zIndex: 20,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              textAlign: 'left',
            }}
            onClick={() => handleExport('DOCX')}
          >
            <span>📝</span> Xuất file Word (.docx)
          </button>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.625rem 0.875rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              textAlign: 'left',
              borderTop: '1px solid var(--color-border)',
            }}
            onClick={() => handleExport('PDF')}
          >
            <span>📄</span> Xuất file PDF (.pdf)
          </button>
        </div>
      )}
    </div>
  );
}
