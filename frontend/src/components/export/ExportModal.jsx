import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { exportService } from '@/services/export';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  Download,
  FileText,
  FileDown,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';

/**
 * Document Export Modal
 * Allows teachers to select document format (DOCX / PDF), customize file name,
 * toggle citation appendix, and download with clear progress and error states.
 */
export function ExportModal({
  isOpen,
  onClose,
  workspaceId,
  generationId,
  defaultFileName = 'giao-an-bai-day',
  planData = null,
  subject = '',
  gradeLevel = '',
}) {
  const { t } = useTranslation();

  const [format, setFormat] = useState('DOCX'); // 'DOCX' | 'PDF'
  const [fileName, setFileName] = useState('');
  const [includeCitations, setIncludeCitations] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize or reset file name when modal opens
  useEffect(() => {
    if (isOpen) {
      const sanitized = (defaultFileName || 'giao-an')
        .toLowerCase()
        .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s_-]/gi, '')
        .trim()
        .replace(/\s+/g, '-');
      setFileName(sanitized || 'giao-an-bai-day');
      setError(null);
      setIsSuccess(false);
      setIsExporting(false);
    }
  }, [isOpen, defaultFileName]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  const handleExport = async (e) => {
    e?.preventDefault();
    if (!workspaceId) {
      setError(t('workspace.selectFirst', 'Vui lòng chọn không gian làm việc trước.'));
      return;
    }

    try {
      setIsExporting(true);
      setError(null);
      setIsSuccess(false);

      const targetFileName = fileName.trim() || 'giao-an-bai-day';

      await exportService.exportDocument({
        workspaceId,
        generationId: generationId || 'latest',
        format,
        defaultFileName: targetFileName,
        includeCitations,
        planData,
        subject,
        gradeLevel,
      });

      setIsSuccess(true);
      toast.success(t('export.success', 'Tải xuống tài liệu thành công!'));

      // Automatically close modal after brief delay so teacher sees success feedback
      setTimeout(() => {
        if (isOpen) {
          onClose();
        }
      }, 1200);
    } catch (err) {
      console.error('Export error in modal:', err);
      const msg = err.message || t('export.failed', 'Xuất tài liệu thất bại. Vui lòng thử lại.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base font-bold text-foreground">
                {t('export.modalTitle', 'Xuất Tài Liệu Bài Dạy')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('export.modalSubtitle', 'Lựa chọn định dạng để tải tệp về máy tính của Thầy/Cô')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            title={t('export.close', 'Đóng')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleExport} className="p-6 space-y-5">
          {/* Format Selection (AC1: User chọn được format) */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5">
              {t('export.selectFormat', 'Định dạng tệp tải về')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* DOCX Option */}
              <button
                type="button"
                onClick={() => {
                  setFormat('DOCX');
                  setError(null);
                }}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  format === 'DOCX'
                    ? 'border-emerald-600 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                    : 'border-border hover:border-border/80 bg-background'
                }`}
              >
                {format === 'DOCX' && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2.5">
                  <FileText className="w-5 h-5" />
                </div>
                <strong className="text-sm font-semibold text-foreground">
                  {t('export.docxTitle', 'Microsoft Word (.docx)')}
                </strong>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t('export.docxDesc', 'Dễ dàng chỉnh sửa, thay đổi định dạng và in ấn')}
                </p>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => {
                  setFormat('PDF');
                  setError(null);
                }}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  format === 'PDF'
                    ? 'border-emerald-600 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                    : 'border-border hover:border-border/80 bg-background'
                }`}
              >
                {format === 'PDF' && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center mb-2.5">
                  <FileDown className="w-5 h-5" />
                </div>
                <strong className="text-sm font-semibold text-foreground">
                  {t('export.pdfTitle', 'Tài liệu PDF (.pdf)')}
                </strong>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t('export.pdfDesc', 'Bố cục trang trọng, cố định định dạng chuẩn sư phạm')}
                </p>
              </button>
            </div>
          </div>

          {/* File Name Input */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              {t('export.fileName', 'Tên tệp')}
            </label>
            <div className="flex items-center rounded-lg border border-border bg-background focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all overflow-hidden">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="giao-an-bai-day"
                className="flex-1 px-3.5 py-2 text-sm bg-transparent border-0 focus:outline-none"
              />
              <span className="px-3 py-2 text-xs font-mono text-muted-foreground bg-muted/40 border-l border-border select-none">
                .{format.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Citations Appendix Option */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="include-citations"
              checked={includeCitations}
              onChange={(e) => setIncludeCitations(e.target.checked)}
              className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="include-citations" className="text-xs text-foreground font-medium cursor-pointer">
              {t('export.includeCitations', 'Đính kèm phụ lục nguồn trích dẫn học liệu ở chân trang')}
            </label>
          </div>

          {/* Error Message Display (AC4: Error được hiển thị rõ ràng) */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold">{t('export.errorTitle', 'Xuất tài liệu chưa thành công')}</p>
                <p className="leading-relaxed opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Success Feedback Display */}
          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{t('export.success', 'Tải xuống tài liệu thành công!')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
              className="text-xs"
            >
              {t('export.close', 'Đóng')}
            </Button>

            <Button
              type="submit"
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 flex items-center gap-1.5"
            >
              {isExporting ? (
                <>
                  <Spinner className="w-3.5 h-3.5 text-white" />
                  <span>
                    {t('export.downloading', 'Đang khởi tạo tài liệu {{format}}...', {
                      format,
                    })}
                  </span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('export.success', 'Đã tải xuống')}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {t('export.downloadBtn', 'Tải xuống tệp {{format}}', {
                      format,
                    })}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExportModal;
