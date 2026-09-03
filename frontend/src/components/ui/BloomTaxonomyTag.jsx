import React from 'react';

const BLOOM_CLASS_MAP = {
  remember: 'bloom-badge--remember',
  understand: 'bloom-badge--understand',
  apply: 'bloom-badge--apply',
  analyze: 'bloom-badge--analyze',
  evaluate: 'bloom-badge--evaluate',
  create: 'bloom-badge--create',
};

const BLOOM_LABEL_MAP = {
  remember: 'Nhận biết',
  understand: 'Thông hiểu',
  apply: 'Vận dụng',
  analyze: 'Vận dụng cao',
  evaluate: 'Đánh giá',
  create: 'Sáng tạo',
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
  if (!level) return null;

  const key = String(level).toLowerCase().trim();
  const badgeClass = BLOOM_CLASS_MAP[key] || 'badge-neutral';
  const viLabel = BLOOM_LABEL_MAP[key];

  return (
    <span
      className={`bloom-badge ${badgeClass} ${className}`}
      title={`Cấp độ Bloom: ${viLabel || level}`}
      {...props}
    >
      {showVietnamese && viLabel ? `${viLabel} (${level})` : level}
    </span>
  );
}
