import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, X, Lightbulb, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * RegenerationModal — Instruction-based AI content regeneration dialog (FE-016 / ATC-403).
 * Allows teachers to provide pedagogical refinement prompts and create a new versioned entry.
 */
export function RegenerationModal({
  isOpen,
  onClose,
  onRegenerate,
  currentVersion = 1,
  contentType = 'QUIZ', // 'QUIZ' or 'LESSON_PLAN'
  isLoading = false,
}) {
  const { t } = useTranslation();
  const [instructions, setInstructions] = useState('');

  const nextVersion = (Number(currentVersion) || 1) + 1;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setInstructions('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickSuggestions = contentType === 'QUIZ'
    ? [
        t('generation.suggestionQuizHarder', '🎯 Tăng độ khó cho các câu vận dụng'),
        t('generation.suggestionQuizRealWorld', '🌍 Bổ sung bài toán liên hệ thực tế'),
        t('generation.suggestionQuizDetailedExplanation', '💡 Viết lời giải chi tiết và mẹo tránh bẫy'),
        t('generation.suggestionQuizDistractors', '🔄 Cải thiện các phương án nhiễu logic hơn'),
        t('generation.suggestionGroundedOnly', '📚 Bám sát hơn nữa tài liệu trong kho tri thức'),
      ]
    : [
        t('generation.suggestionLessonActive', '🎯 Thêm hoạt động học tập chủ động cho học sinh'),
        t('generation.suggestionLessonTime', '⏱️ Điều chỉnh phân bổ thời gian hợp lý hơn'),
        t('generation.suggestionLessonAssessment', '📝 Bổ sung câu hỏi kiểm tra đánh giá nhanh'),
        t('generation.suggestionLessonDifferentiation', '👥 Thêm phương án phân hóa năng lực học sinh'),
        t('generation.suggestionGroundedOnly', '📚 Bám sát hơn nữa tài liệu trong kho tri thức'),
      ];

  const handleApplySuggestion = (text) => {
    // Strip emoji prefix for clean prompt
    const cleaned = text.replace(/^[\p{Emoji}\s]+/u, '').trim();
    setInstructions((prev) => {
      if (!prev.trim()) return cleaned;
      if (prev.includes(cleaned)) return prev;
      return `${prev.trim()}, ${cleaned.toLowerCase()}`;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    onRegenerate(instructions.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="regenerate-dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="regenerate-dialog-title" className="text-base font-bold text-foreground">
                  {t('generation.regenerateTitle', 'Tạo lại nội dung với AI')}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  v{nextVersion}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'generation.regenerateSubtitle',
                  'Nhập hướng dẫn điều chỉnh để tạo phiên bản mới mà không làm mất bản hiện tại.'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={t('common.close', 'Đóng')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>{t('generation.instructionsLabel', 'Yêu cầu điều chỉnh hoặc bổ sung sư phạm')}</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                {instructions.length} {t('common.characters', 'ký tự')}
              </span>
            </label>
            <textarea
              rows={3}
              autoFocus
              disabled={isLoading}
              className="flex min-h-[90px] w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all resize-none"
              placeholder={t(
                'generation.instructionsPlaceholder',
                'Ví dụ: Tăng độ khó cho các câu vận dụng cao, bổ sung bài toán thực tế đời sống, giải thích cặn kẽ hơn...'
              )}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              {t('generation.quickSuggestions', 'Gợi ý nhanh:')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleApplySuggestion(sug)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/60 hover:border-orange-500/40 transition-all text-left cursor-pointer active:scale-95"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Lineage Info Banner */}
          <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Layers className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {t(
                'generation.versionNotice',
                'Bản hiện tại (v{{curr}}) sẽ được lưu lại nguyên vẹn trong lịch sử. Bạn có thể dễ dàng chuyển đổi qua lại giữa các phiên bản bất kỳ lúc nào.',
                { curr: currentVersion }
              )}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 text-xs font-medium"
            >
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 px-5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/15"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {t('generation.regenerating', 'AI đang tạo phiên bản mới...')}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('generation.regenerateSubmit', 'Tạo phiên bản mới (v{{next}})', { next: nextVersion })}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
