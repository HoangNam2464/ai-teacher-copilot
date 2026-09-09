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
  const badgeClass = BLOOM_CLASS_MAP[key] || 'badge-neutral';
  const translated = t(`bloom.${key}`, { defaultValue: level });

  return (
    <span
      className={`bloom-badge ${badgeClass} ${className}`}
      title={`${t('bloom.title')}: ${translated}`}
      {...props}
    >
      {showVietnamese && i18n.language.startsWith('vi') ? `${translated} (${level})` : translated}
    </span>
  );
}
