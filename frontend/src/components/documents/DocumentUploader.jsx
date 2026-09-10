import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileUp,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export function DocumentUploader({ onUploadSuccess, disabled }) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const validateFile = (candidateFile) => {
    if (!candidateFile) return false;

    // Validate file size (<= 50MB)
    if (candidateFile.size > MAX_FILE_SIZE) {
      setError(
        t(
          'documents.fileSizeExceeded',
          'Dung lượng file vượt quá giới hạn 50MB. Vui lòng chọn tệp nhỏ hơn.'
        )
      );
      return false;
    }

    // Validate file extension (.pdf, .docx, .txt)
    const lowerName = candidateFile.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      setError(
        t(
          'documents.invalidFileType',
          'Định dạng file không hỗ trợ. Vui lòng chọn tệp PDF, DOCX hoặc TXT.'
        )
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    setError('');
    if (!validateFile(selectedFile)) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
  };

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !uploading) {
        setIsDragging(true);
      }
    },
    [disabled, uploading]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [disabled, uploading]
  );

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || uploading || disabled) return;

    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      // Call parent with progress tracking callback
      await onUploadSuccess(file, (progressPct) => {
        setUploadProgress(progressPct);
      });

      // Brief delay at 100% to let user perceive completion before resetting
      setUploadProgress(100);
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 700);
    } catch (err) {
      console.error('Upload failed:', err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        t('documents.uploadFailed', 'Tải lên tài liệu thất bại');
      setError(serverMsg);
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
        'relative bg-card border-2 border-dashed rounded-2xl p-6 md:p-8 transition-all duration-200 text-center',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.005] shadow-md shadow-primary/5'
          : 'border-border hover:border-primary/40',
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

      {/* Uploading In Progress View */}
      {uploading ? (
        <div className="py-4 space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary animate-pulse">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-base text-foreground">
              {uploadProgress >= 100
                ? t('documents.processingAi', 'Đang lưu trữ & khởi tạo RAG AI...')
                : t('documents.uploadingProgress', {
                    progress: uploadProgress,
                    defaultValue: `Đang tải lên: ${uploadProgress}%`,
                  })}
            </h4>
            <p className="text-xs text-muted-foreground truncate max-w-xs mx-auto">
              {file?.name} ({formatFileSize(file?.size)})
            </p>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner relative">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                uploadProgress >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-primary'
              )}
              style={{ width: `${Math.max(uploadProgress, 5)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
            <span>{uploadProgress < 100 ? 'Tải lên máy chủ' : 'Xử lý vector embeddings'}</span>
            <span className="font-mono font-semibold text-foreground">{uploadProgress}%</span>
          </div>
        </div>
      ) : (
        /* Normal / Idle / Selected View */
        <div className={cn('space-y-4', isDragging && 'pointer-events-none')}>
          {/* Main Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
            <UploadCloud className="w-7 h-7" />
          </div>

          {/* Prompt Titles */}
          <div>
            <h3 className="font-bold text-base md:text-lg text-foreground">
              {isDragging
                ? t('documents.dropFileHere', 'Thả tệp vào đây để tải lên')
                : t('documents.uploaderTitle', 'Tải Lên Tài Liệu Giảng Dạy Mới')}
            </h3>
            <p className="text-muted-foreground text-xs md:text-sm max-w-lg mx-auto mt-1 leading-relaxed">
              {t(
                'documents.uploaderDesc',
                'Hỗ trợ định dạng PDF, DOCX, TXT (tối đa 50MB). Tài liệu sẽ được index để phục vụ RAG AI.'
              )}
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs md:text-sm max-w-md mx-auto text-left">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="p-1 hover:bg-destructive/20 rounded-md transition-colors"
                title={t('common.close', 'Đóng')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Selected File Card Preview */}
          {file && (
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/60 border border-border text-sm max-w-md mx-auto shadow-xs text-left">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-xs md:text-sm truncate">
                  {file.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title={t('documents.removeFile', 'Bỏ chọn')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-xs md:text-sm h-10 px-4 gap-2"
            >
              <FileUp className="w-4 h-4" />
              {file
                ? t('documents.changeFile', 'Chọn file khác')
                : t('documents.browseFile', 'Duyệt file từ máy tính')}
            </Button>

            {file && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={disabled || uploading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs md:text-sm h-10 px-5 gap-2 font-medium shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('documents.startUpload', 'Bắt đầu tải lên & Xử lý AI')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default DocumentUploader;
