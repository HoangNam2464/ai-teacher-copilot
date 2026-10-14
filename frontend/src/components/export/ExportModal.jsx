import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { exportService } from '@/services/export';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { QuizExportControls } from './QuizExportControls';
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
  Shield,
  Layers,
} from 'lucide-react';

/**
 * Document Export Modal
 * Allows teachers to select document format (DOCX / PDF), customize file name,
 * toggle citation appendix, and select Student Exam Sheet vs Teacher Answer Key (FE-019 / ATC-406).
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
  contentType = '',
}) {
  const { t } = useTranslation();

  const [format, setFormat] = useState('DOCX'); // 'DOCX' | 'PDF'
  const [fileName, setFileName] = useState('');
  const [exportMode, setExportMode] = useState('STUDENT_EXAM'); // 'STUDENT_EXAM' | 'TEACHER_KEY' | 'BOTH'
  const [includeCitations, setIncludeCitations] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if content being exported is a Quiz
  const isQuiz =
    contentType === 'QUIZ' ||
    Boolean(planData?.questions) ||
    Boolean(planData?.contentData?.questions) ||
    Boolean(planData?.data?.questions) ||
    Array.isArray(planData) ||
    (defaultFileName && defaultFileName.toLowerCase().includes('de-thi'));

  // Initialize or reset file name and export mode when modal opens
  useEffect(() => {
    if (isOpen) {
      const sanitized = (defaultFileName || (isQuiz ? 'de-thi' : 'giao-an'))
        .toLowerCase()
        .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s_-]/gi, '')
        .trim()
        .replace(/\s+/g, '-');
      setFileName(sanitized || (isQuiz ? 'de-kiem-tra' : 'giao-an-bai-day'));
      setExportMode('STUDENT_EXAM');
      setError(null);
      setIsSuccess(false);
      setIsExporting(false);
    }
  }, [isOpen, defaultFileName, isQuiz]);

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

      const baseName = fileName.trim() || (isQuiz ? 'de-kiem-tra' : 'giao-an-bai-day');

      if (isQuiz && exportMode === 'BOTH') {
        // Download 1: Student Exam Sheet (strictly no answers)
        const studentName = `[De-thi-hoc-sinh] ${baseName}`;
        await exportService.exportDocument({
          workspaceId,
          generationId: generationId || 'latest',
          format,
          defaultFileName: studentName,
          includeCitations: false,
          planData,
          subject,
          gradeLevel,
          exportMode: 'STUDENT_EXAM',
          contentType: 'QUIZ',
        });

        // Delay 800ms before triggering second file download
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Download 2: Teacher Answer Key & Explanations
        const teacherName = `[Dap-an-giao-vien] ${baseName}`;
        await exportService.exportDocument({
          workspaceId,
          generationId: generationId || 'latest',
          format,
          defaultFileName: teacherName,
          includeCitations,
          planData,
          subject,
          gradeLevel,
          exportMode: 'TEACHER_KEY',
          contentType: 'QUIZ',
        });

        setIsSuccess(true);
        toast.success(t('export.bothSuccess', 'Đã tải xuống thành công trọn bộ Đề thi và Đáp án!'));
      } else {
        const filePrefix = isQuiz
          ? exportMode === 'STUDENT_EXAM'
            ? '[De-thi] '
            : '[Dap-an] '
          : '';
        const fullFileName = `${filePrefix}${baseName}`;

        await exportService.exportDocument({
          workspaceId,
          generationId: generationId || 'latest',
          format,
          defaultFileName: fullFileName,
          includeCitations: isQuiz && exportMode === 'STUDENT_EXAM' ? false : includeCitations,
          planData,
          subject,
          gradeLevel,
          exportMode,
          contentType: isQuiz ? 'QUIZ' : (contentType || 'LESSON_PLAN'),
        });

        setIsSuccess(true);
        toast.success(
          isQuiz
            ? exportMode === 'STUDENT_EXAM'
              ? t('export.studentExamSuccess', 'Tải xuống đề thi học sinh thành công!')
              : t('export.teacherKeySuccess', 'Tải xuống đáp án giáo viên thành công!')
            : t('export.success', 'Tải xuống tài liệu thành công!')
        );
      }

      // Automatically close modal after brief delay so teacher sees success feedback
      setTimeout(() => {
        if (isOpen) {
          onClose();
        }
      }, 1400);
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
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-base font-bold text-foreground">
                {isQuiz
                  ? t('export.quizModalTitle', 'Xuất Đề Kiểm Tra & Đáp Án')
                  : t('export.modalTitle', 'Xuất Tài Liệu Bài Dạy')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isQuiz
                  ? t('export.quizModalSubtitle', 'Lựa chọn đề thi cho học sinh hoặc đáp án và hướng dẫn chấm')
                  : t('export.modalSubtitle', 'Lựa chọn định dạng để tải tệp về máy tính của Thầy/Cô')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 cursor-pointer"
            title={t('common.close', 'Đóng')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleExport} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quiz Controls: Student Exam vs Teacher Answer Key (FE-019 / ATC-406) */}
          {isQuiz && (
            <QuizExportControls
              exportMode={exportMode}
              onChangeMode={(mode) => {
                setExportMode(mode);
                setError(null);
              }}
              disabled={isExporting}
            />
          )}

          {/* Format Selection (DOCX / PDF) */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
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
                className={`relative flex flex-col p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  format === 'DOCX'
                    ? 'border-emerald-600 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                    : 'border-border hover:border-border/80 bg-background'
                }`}
              >
                {format === 'DOCX' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <strong className="text-xs font-bold text-foreground">
                  {t('export.docxTitle', 'Microsoft Word (.docx)')}
                </strong>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
                className={`relative flex flex-col p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  format === 'PDF'
                    ? 'border-emerald-600 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                    : 'border-border hover:border-border/80 bg-background'
                }`}
              >
                {format === 'PDF' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center mb-2">
                  <FileDown className="w-4 h-4" />
                </div>
                <strong className="text-xs font-bold text-foreground">
                  {t('export.pdfTitle', 'Tài liệu PDF (.pdf)')}
                </strong>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
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
                placeholder={isQuiz ? 'de-kiem-tra' : 'giao-an-bai-day'}
                className="flex-1 px-3 py-2 text-xs bg-transparent border-0 focus:outline-none"
              />
              <span className="px-3 py-2 text-xs font-mono text-muted-foreground bg-muted/40 border-l border-border select-none">
                .{format.toLowerCase()}
              </span>
            </div>
            {isQuiz && exportMode === 'BOTH' && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {t(
                  'export.bothFilesHint',
                  'Hệ thống sẽ tự động thêm tiền tố [De-thi-hoc-sinh] và [Dap-an-giao-vien] vào từng tệp.'
                )}
              </p>
            )}
          </div>

          {/* Security Notice for Student Exam or Citations Appendix Option */}
          {isQuiz && exportMode === 'STUDENT_EXAM' ? (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <div className="space-y-0.5">
                <p className="font-semibold text-xs">
                  {t('export.studentExamProtected', 'Bản đề thi học sinh được bảo mật')}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    'export.studentExamNotice',
                    'Toàn bộ đáp án đúng, giải thích chi tiết và trích dẫn được ẩn hoàn toàn để phục vụ in đề thi.'
                  )}
                </p>
              </div>
            </div>
          ) : isQuiz ? (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                type="checkbox"
                id="include-citations"
                checked={includeCitations}
                onChange={(e) => setIncludeCitations(e.target.checked)}
                className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="include-citations" className="text-xs text-foreground font-medium cursor-pointer">
                {t('export.includeCitationsQuiz', 'Đính kèm bảng chuẩn Bloom và phụ lục căn cứ trích dẫn học liệu')}
              </label>
            </div>
          ) : (
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
          )}

          {/* Error Message Display */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold">{t('export.errorTitle', 'Xuất tài liệu chưa thành công')}</p>
                <p className="leading-relaxed opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Success Feedback Display */}
          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{t('export.success', 'Tải xuống tài liệu thành công!')}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
              className="text-xs cursor-pointer"
            >
              {t('common.close', 'Đóng')}
            </Button>

            <Button
              type="submit"
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Spinner className="w-3.5 h-3.5 text-white" />
                  <span>
                    {isQuiz && exportMode === 'BOTH'
                      ? t('export.downloadingBoth', 'Đang tạo trọn bộ 2 bản {{format}}...', { format })
                      : t('export.downloading', 'Đang khởi tạo tài liệu {{format}}...', { format })}
                  </span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('export.success', 'Đã tải xuống')}</span>
                </>
              ) : isQuiz ? (
                exportMode === 'BOTH' ? (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t('export.downloadBothBtn', 'Tải trọn bộ 2 tệp ({{format}})', { format })}</span>
                  </>
                ) : exportMode === 'STUDENT_EXAM' ? (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('export.downloadStudentBtn', 'Tải đề thi học sinh ({{format}})', { format })}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('export.downloadTeacherBtn', 'Tải đáp án & lời giải ({{format}})', { format })}</span>
                  </>
                )
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('export.downloadBtn', 'Tải xuống tệp {{format}}', { format })}</span>
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
