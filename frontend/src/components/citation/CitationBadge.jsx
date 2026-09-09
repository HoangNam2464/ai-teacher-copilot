import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpenIcon } from '@/components/ui/Icons';

export function CitationBadge({ count = 0, onClick }) {
  const { t } = useTranslation();
  if (!count || count === 0) return null;

  return (
    <button
      type="button"
      className="citation-badge"
      onClick={onClick}
      title={t('citation.badgeTitle')}
    >
      <BookOpenIcon size={12} />
      <span>{t('citation.sourcesCount', { count })}</span>
    </button>
  );
}

