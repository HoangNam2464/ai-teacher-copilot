import React from 'react';
import { useTranslation } from 'react-i18next';

export const BLOOM_CLASS_MAP = {
  remember: 'bloom-badge--remember',
  understand: 'bloom-badge--understand',
  apply: 'bloom-badge--apply',
  analyze: 'bloom-badge--analyze',
  evaluate: 'bloom-badge--evaluate',
  create: 'bloom-badge--create',
};

export const BLOOM_TAILWIND_MAP = {
  remember: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  understand: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  apply: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  analyze: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  evaluate: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  create: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

export const BLOOM_ACTIVE_MAP = {
  remember: 'ring-2 ring-blue-500 ring-offset-1 font-bold shadow-xs',
  understand: 'ring-2 ring-emerald-500 ring-offset-1 font-bold shadow-xs',
  apply: 'ring-2 ring-amber-500 ring-offset-1 font-bold shadow-xs',
  analyze: 'ring-2 ring-orange-500 ring-offset-1 font-bold shadow-xs',
  evaluate: 'ring-2 ring-purple-500 ring-offset-1 font-bold shadow-xs',
  create: 'ring-2 ring-rose-500 ring-offset-1 font-bold shadow-xs',
};

/**
 * Normalizes any variation of Bloom taxonomy level (English or Vietnamese) to standard 6 keys:
 * 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
 */
export function normalizeBloomLevel(level) {
  if (!level) return '';
  const s = String(level).toLowerCase().trim();
  if (s.includes('remember') || s.includes('nhận biết') || s.includes('nhan biet')) return 'remember';
  if (s.includes('understand') || s.includes('thông hiểu') || s.includes('thong hieu')) return 'understand';
  if (s.includes('apply') || s.includes('vận dụng') || s.includes('van dung')) {
    if (s.includes('cao') || s.includes('phân tích')) return 'analyze';
    return 'apply';
  }
  if (s.includes('analyze') || s.includes('phân tích') || s.includes('phan tich')) return 'analyze';
  if (s.includes('evaluate') || s.includes('đánh giá') || s.includes('danh gia')) return 'evaluate';
  if (s.includes('create') || s.includes('sáng tạo') || s.includes('sang tao')) return 'create';
  return s;
}

/**
 * Standard Bloom Taxonomy Visual Tag
 * Adheres to SOURCE_OF_TRUTH.md Section 1.1 fixed 6 token pairs
 */
export function BloomTaxonomyTag({
  level = 'Remember',
  showVietnamese = false,
  count,
  active = false,
  interactive = false,
  onClick,
  className = '',
  ...props
}) {
  const { t, i18n } = useTranslation();
  if (!level) return null;

  const key = normalizeBloomLevel(level);
  const colorClass = BLOOM_TAILWIND_MAP[key] || 'bg-muted text-muted-foreground border-border';
  const activeClass = active ? (BLOOM_ACTIVE_MAP[key] || 'ring-2 ring-primary') : '';
  const isClickable = Boolean(onClick || interactive);
  const interactiveClass = isClickable
    ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none'
    : '';

  const translated = t(`bloom.${key}`, { defaultValue: level });
  const label = showVietnamese && i18n.language.startsWith('vi')
    ? `${translated} (${level})`
    : translated;

  const handleKeyDown = (e) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <span
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} ${activeClass} ${interactiveClass} ${className}`}
      title={isClickable ? `${t('quizGenerator.clickToFilter', 'Nhấn để lọc theo cấp độ')}: ${translated}` : `${t('bloom.title', 'Thang đo Bloom')}: ${translated}`}
      {...props}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-black/10 dark:bg-white/15">
          {count}
        </span>
      )}
    </span>
  );
}
