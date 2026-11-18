import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, BookOpen, FileText, Copy, Check, ExternalLink } from 'lucide-react';

/**
 * CitationDrawer Component [FE-011]
 * Slide-over drawer displaying referenced source documents and content excerpts.
 * Guaranteed to operate in fixed overlay without affecting the underlying lesson layout.
 */
export function CitationDrawer({
  isOpen,
  onClose,
  citations = [],
  title,
}) {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle copying excerpt to clipboard
  const handleCopyExcerpt = async (excerpt, id) => {
    if (!excerpt) return;
    try {
      await navigator.clipboard.writeText(excerpt);
      setCopiedId(id);
      toast.success(t('citation.excerptCopied', 'Đã sao chép đoạn trích vào bộ nhớ tạm'));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t('common.copyFailed', 'Sao chép thất bại'));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="relative w-full sm:max-w-md md:max-w-lg bg-card border-l border-border h-full shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border bg-muted/20 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-snug">
                      {title || t('citation.drawerTitle', 'Tài Liệu Tham Khảo Bài Dạy')}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-10">
                  {t(
                    'citation.drawerSubtitle',
                    'Các đoạn trích dẫn được đối chiếu từ tài liệu bài học trong không gian làm việc'
                  )}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('citation.close', 'Đóng bảng tham khảo')}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total count status bar */}
            {citations.length > 0 && (
              <div className="px-5 py-2.5 bg-muted/30 border-b border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {t('citation.totalCount', { count: citations.length })}
                </span>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {citations.length} mục
                </span>
              </div>
            )}

            {/* Drawer Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {citations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground/80">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium">
                    {t('citation.empty', 'Chưa có tài liệu tham khảo nào cho nội dung này.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {citations.map((c, index) => {
                    const itemKey = c.chunkId || `citation-${index}`;
                    const isCopied = copiedId === itemKey;

                    return (
                      <div
                        key={itemKey}
                        className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/35 transition-all shadow-xs space-y-2.5"
                      >
                        {/* Source Document Header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-foreground flex items-center gap-1.5 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate" title={c.fileName || t('citation.sourceDoc', 'Tài liệu học liệu')}>
                              {c.fileName || t('citation.sourceDoc', 'Tài liệu học liệu')}
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {c.sourcePage ? (
                              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                                {t('citation.page', 'Trang')} {c.sourcePage}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                                {t('citation.sourceItem', { number: index + 1 })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Excerpt Quote */}
                        {c.excerpt && (
                          <div className="relative">
                            <blockquote className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/70 whitespace-pre-line italic font-normal">
                              "{c.excerpt}"
                            </blockquote>
                          </div>
                        )}

                        {/* Action Toolbar for Chunk */}
                        {c.excerpt && (
                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopyExcerpt(c.excerpt, itemKey)}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground py-1 px-2 rounded-md hover:bg-muted transition-colors"
                              title={t('citation.copyExcerpt', 'Sao chép đoạn trích')}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-medium">
                                    {t('common.copied', 'Đã chép')}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>{t('citation.copyExcerpt', 'Sao chép')}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                AI Teacher Copilot • Grounding Provenance
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {t('common.close', 'Đóng')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CitationDrawer;

