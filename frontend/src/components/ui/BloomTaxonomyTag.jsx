import React from 'react';
import { useTranslation } from 'react-i18next';

const BLOOM_CLASS_MAP = {
  remember: 'bloom-badge--remember',
  understand: 'bloom-badge--understand',
  apply: 'bloom-badge--apply',
  analyze: 'bloom-badge--analyze',
  evaluate: 'bloom-badge--evaluate',
  create: 'bloom-badge--create',
};

const BLOOM_TAILWIND_MAP = {
  remember: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  understand: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  apply: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  analyze: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  evaluate: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  create: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

/**
 * Standard Bloom Taxonomy Visual Tag
 * Adheres to SOURCE_OF_TRUTH.md Section 1.1 fixed 6 token pairs
 */
export function BloomTaxonomyTag({
  level = 'Remember',
  showVietnamese = false,
  className = '',
  ...props
}) {
  const { t, i18n } = useTranslation();
  if (!level) return null;

  const key = String(level).toLowerCase().trim();
  const colorClass = BLOOM_TAILWIND_MAP[key] || 'bg-muted text-muted-foreground border-border';
  const translated = t(`bloom.${key}`, { defaultValue: level });

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${className}`}
      title={`${t('bloom.title', 'Thang đo Bloom')}: ${translated}`}
      {...props}
    >
      {showVietnamese && i18n.language.startsWith('vi') ? `${translated} (${level})` : translated}
    </span>
  );
}
