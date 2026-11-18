import React, { useState, useRef } from 'react';
import { Button } from '../../../core/components/ui/Button';
import { formatFileSize } from '../../../core/utils/formatters';
import {
  IconUpload,
  IconFileText,
  IconClose,
  IconAlertCircle,
  IconCheckCircle,
} from '../../../core/components/icons/SvgIcons';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function DocumentUploadZone({ onUpload, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;

    const fileName = file.name.toLowerCase();
    const isAllowed = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!isAllowed) {
      setError('Định dạng file không được hỗ trợ. Vui lòng chỉ tải lên file PDF, DOCX hoặc TXT.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Dung lượng file vượt quá giới hạn cho phép 50MB (kích thước hiện tại: ${formatFileSize(file.size)}).`);
      return false;
    }

    setError('');
    return true;
  };

  const handleFileSelection = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setSuccessMsg('');
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleTriggerBrowse = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTriggerBrowse();
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || uploading || disabled) return;

    try {
      setUploading(true);
      setError('');
      setSuccessMsg('');

      await onUpload(selectedFile);

      setSuccessMsg(`Tải lên thành công: ${selectedFile.name}. Quá trình bóc tách vector RAG đang chạy ngầm.`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error('Document upload error:', err);
      setError(err.response?.data?.message || err.message || 'Tải lên tài liệu thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>
          Tải Lên Tài Liệu & Tri Thức Học Liệu Mới
        </h3>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', margin: 0 }}>
          Tài liệu sẽ được đưa vào hệ thống lưu trữ MinIO và kích hoạt pipeline bóc tách vector hóa (RAG pgvector).
        </p>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={disabled || uploading}
        aria-label="Chọn tệp tài liệu học liệu từ máy tính"
      />

      {/* Interactive Drop Zone */}
      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        onClick={handleTriggerBrowse}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-primary-border)'}`,
          backgroundColor: isDragOver ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6) var(--space-4)',
          textAlign: 'center',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: isDragOver ? 'var(--color-bg-surface)' : 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-1)',
            transition: 'all var(--transition-fast)',
          }}
        >
          <IconUpload size={22} />
        </span>

        <div>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-primary)' }}>
            Nhấn để duyệt tệp
          </span>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {' '}hoặc kéo & thả tài liệu vào khung này
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)' }}>
          <span>Định dạng: <strong>PDF, DOCX, TXT</strong></span>
          <span>•</span>
          <span>Dung lượng tối đa: <strong>50 MB</strong></span>
        </div>
      </div>

      {/* Selected File Preview Box */}
      {selectedFile && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)', minWidth: 0 }}>
            <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
              <IconFileText size={20} />
            </span>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {selectedFile.name}
              </div>
              <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-mono)' }}>
                {formatFileSize(selectedFile.size)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearSelection}
              disabled={uploading}
              icon={<IconClose size={14} />}
            >
              Hủy chọn
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStartUpload}
              loading={uploading}
              disabled={uploading || disabled}
              icon={<IconUpload size={14} />}
            >
              {uploading ? 'Đang nạp dữ liệu...' : 'Bắt đầu nạp học liệu & Xử lý AI'}
            </Button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-2-5) var(--space-3)',
            backgroundColor: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger-text)',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
          role="alert"
        >
          <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-2-5) var(--space-3)',
            backgroundColor: 'var(--color-success-light)',
            border: '1px solid var(--color-success-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-success-text)',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
          role="status"
        >
          <IconCheckCircle size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
