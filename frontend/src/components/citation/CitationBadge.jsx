import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

export function CitationBadge({ count = 0, onClick }) {
  const { t } = useTranslation();
  if (!count || count === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-semibold border border-emerald-500/20 transition-colors shadow-xs"
      title={t('citation.badgeTitle', 'Xem nguồn trích dẫn học liệu')}
    >
      <BookOpen className="w-3.5 h-3.5" />
      <span>{t('citation.sourcesCount', { count: count })}</span>
    </button>
  );
}
