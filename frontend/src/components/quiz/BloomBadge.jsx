import React from 'react';
import { useTranslation } from 'react-i18next';

export const BLOOM_COLOR_MAP = {
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

export const BLOOM_PROGRESS_BAR_COLOR_MAP = {
  remember: 'bg-blue-500',
  understand: 'bg-emerald-500',
  apply: 'bg-amber-500',
  analyze: 'bg-orange-500',
  evaluate: 'bg-purple-500',
  create: 'bg-rose-500',
};

export const BLOOM_STANDARD_LEVELS = [
  { key: 'remember', en: 'Remember', vi: 'Nhận biết', levelNum: 1 },
  { key: 'understand', en: 'Understand', vi: 'Thông hiểu', levelNum: 2 },
  { key: 'apply', en: 'Apply', vi: 'Vận dụng', levelNum: 3 },
  { key: 'analyze', en: 'Analyze', vi: 'Vận dụng cao', levelNum: 4 },
  { key: 'evaluate', en: 'Evaluate', vi: 'Đánh giá', levelNum: 5 },
  { key: 'create', en: 'Create', vi: 'Sáng tạo', levelNum: 6 },
];

/**
 * Normalizes any string representation of Bloom's Taxonomy level into standard key:
 * 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
 */
export function normalizeBloomLevel(level) {
  if (!level) return '';
  const s = String(level).toLowerCase().trim();
  if (s.includes('remember') || s.includes('nhận biết') || s.includes('nhan biet') || s.includes('ghi nhớ')) return 'remember';
  if (s.includes('understand') || s.includes('thông hiểu') || s.includes('thong hieu') || s.includes('hiểu')) return 'understand';
  if (s.includes('apply') || s.includes('vận dụng') || s.includes('van dung') || s.includes('áp dụng')) {
    if (s.includes('cao') || s.includes('phân tích')) return 'analyze';
    return 'apply';
  }
  if (s.includes('analyze') || s.includes('phân tích') || s.includes('phan tich')) return 'analyze';
  if (s.includes('evaluate') || s.includes('đánh giá') || s.includes('danh gia')) return 'evaluate';
  if (s.includes('create') || s.includes('sáng tạo') || s.includes('sang tao')) return 'create';
  return s;
}

const SIZE_CLASSES = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

/**
 * BloomBadge — Educational Cognitive Level Badge for K-12 Quiz Questions.
 * Deliverable for [FE-015 / ATC-84].
 */
export function BloomBadge({
  level = 'Remember',
  showVietnamese = true,
  count,
  percentage,
  active = false,
  interactive = false,
  size = 'md',
  onClick,
  className = '',
  ...props
}) {
  const { t, i18n } = useTranslation();
  if (!level) return null;

  const key = normalizeBloomLevel(level);
  const colorClass = BLOOM_COLOR_MAP[key] || 'bg-muted text-muted-foreground border-border';
  const activeClass = active ? (BLOOM_ACTIVE_MAP[key] || 'ring-2 ring-primary ring-offset-1') : '';
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const isClickable = Boolean(onClick || interactive);
  const interactiveClass = isClickable
    ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all select-none'
    : '';

  const translated = t(`bloom.${key}`, { defaultValue: level });
  const label = showVietnamese && i18n.language?.startsWith('vi')
    ? translated
    : (t(`bloom.${key}`, { defaultValue: level }) || level);

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
      className={`inline-flex items-center rounded-full font-semibold border ${sizeClass} ${colorClass} ${activeClass} ${interactiveClass} ${className}`}
      title={isClickable ? `${t('quizGenerator.clickToFilter', 'Lọc theo cấp độ')}: ${translated}` : `${t('bloom.title', 'Thang đo Bloom')}: ${translated}`}
      {...props}
    >
      <span>{label}</span>

      {count !== undefined && (
        <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-black/10 dark:bg-white/15">
          {count}
        </span>
      )}

      {percentage !== undefined && (
        <span className="text-[10px] opacity-80 font-medium">
          ({percentage}%)
        </span>
      )}
    </span>
  );
}
