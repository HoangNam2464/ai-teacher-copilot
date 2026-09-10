import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DocumentUploader({ onUploadSuccess, disabled }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError(t('documents.fileSizeExceeded', 'Dung lượng file vượt quá giới hạn 50MB'));
      setFile(null);
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.txt'];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError('Định dạng file không hỗ trợ. Vui lòng chọn PDF, DOCX hoặc TXT.');
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      await onUploadSuccess(file);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err?.response?.data?.message || t('documents.uploadFailed', 'Tải lên tài liệu thất bại'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'bg-card border-2 border-dashed rounded-2xl p-6 md:p-8 transition-all duration-200 text-center relative',
        isDragging
          ? 'border-green-500 bg-green-500/5 scale-[1.005]'
          : 'border-border hover:border-green-500/40',
        disabled && 'opacity-60 pointer-events-none'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        disabled={disabled || uploading}
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        className="hidden"
        id="document-file-input"
      />

      <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 text-green-600">
        <UploadCloud className="w-7 h-7" />
      </div>

      <h3 className="font-bold text-base md:text-lg mb-1">
        {t('documents.uploaderTitle', 'Tải Lên Tài Liệu Giảng Dạy Mới')}
      </h3>
      <p className="text-muted-foreground text-xs md:text-sm max-w-lg mx-auto mb-4">
        {t(
          'documents.uploaderDesc',
          'Hỗ trợ PDF, DOCX, TXT (tối đa 50MB). Tài liệu sẽ được phân đoạn và đánh chỉ mục vector tự động phục vụ RAG AI.'
        )}
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs md:text-sm max-w-md mx-auto text-left">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file && (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm mb-4">
          <FileText className="w-4 h-4 text-green-600" />
          <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
            {file.name}
          </span>
          <span className="text-xs text-muted-foreground">
            ({(file.size / (1024 * 1024)).toFixed(1)} MB)
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="text-xs md:text-sm"
        >
          {file ? 'Chọn file khác' : 'Duyệt file từ máy tính'}
        </Button>

        {file && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={disabled || uploading}
            className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Spinner className="w-4 h-4 text-white" />
                {t('common.processing', 'Đang phân tích & tải lên...')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {t('documents.startUpload', 'Bắt đầu nạp tài liệu')}
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
