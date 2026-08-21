import React, { useState, useRef, useEffect } from 'react';
import { exportService } from '../../services/exportService';
import { Button } from '../ui/Button';
import { IconDownload, IconChevronDown, IconFileText, IconFile } from '../icons/SvgIcons';

export function ExportDropdown({ workspaceId, generationId, defaultFileName = 'tai-lieu' }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        loading={isExporting}
      >
        <IconDownload size={15} />
        <span>Xuất tài liệu</span>
        <IconChevronDown size={14} style={{ opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
      </Button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            minWidth: '190px',
            zIndex: 30,
            overflow: 'hidden',
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2-5)',
              width: '100%',
              padding: 'var(--space-2-5) var(--space-3)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => handleExport('DOCX')}
          >
            <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
              <IconFileText size={16} />
            </span>
            <span>Xuất file Word (.docx)</span>
          </button>
          <button
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2-5)',
              width: '100%',
              padding: 'var(--space-2-5) var(--space-3)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
              textAlign: 'left',
              borderTop: '1px solid var(--color-border-subtle)',
              cursor: 'pointer',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            onClick={() => handleExport('PDF')}
          >
            <span style={{ color: 'var(--color-danger)', display: 'flex' }}>
              <IconFile size={16} />
            </span>
            <span>Xuất file PDF (.pdf)</span>
          </button>
        </div>
      )}
    </div>
  );
}
