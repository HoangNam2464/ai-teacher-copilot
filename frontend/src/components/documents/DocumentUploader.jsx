import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function DocumentUploader({ onUploadSuccess, disabled }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setError(t('documents.fileSizeExceeded'));
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      await onUploadSuccess(file);
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || t('documents.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'var(--color-bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border-focus)' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        {t('documents.uploaderTitle')}
      </h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        {t('documents.uploaderDesc')}
      </p>

      {error && (
        <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          disabled={disabled || uploading}
          onChange={handleFileChange}
          style={{ fontSize: '0.875rem' }}
        />

        <Button
          onClick={handleUpload}
          disabled={!file || disabled || uploading}
          className="gap-2"
        >
          {uploading ? t('common.processing') : t('documents.startUpload')}
        </Button>
      </div>
    </div>
  );
}
