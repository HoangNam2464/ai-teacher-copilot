import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, FileText } from 'lucide-react';

export function CitationDrawer({ isOpen, onClose, citations = [] }) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl p-6 flex flex-col z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold text-base text-foreground">
                  {t('citation.drawerTitle', 'Nguồn Trích Dẫn Học Liệu')}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {citations.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">
                {t('citation.empty', 'Không có nguồn trích dẫn nào.')}
              </p>
            ) : (
              <div className="space-y-3 flex-1">
                {citations.map((c, index) => (
                  <div
                    key={c.chunkId || index}
                    className="p-4 rounded-xl border border-border bg-muted/30 hover:border-emerald-500/30 transition-colors space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-emerald-600 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {c.fileName || t('citation.sourceDoc', 'Tài liệu nguồn')}
                      </span>
                      {c.sourcePage && (
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {t('citation.page', 'Trang')} {c.sourcePage}
                        </span>
                      )}
                    </div>
                    {c.excerpt && (
                      <p className="text-xs text-muted-foreground leading-relaxed italic bg-background/50 p-2 rounded-lg border border-border/50">
                        "{c.excerpt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
