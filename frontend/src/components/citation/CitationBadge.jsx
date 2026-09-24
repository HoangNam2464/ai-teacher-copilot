import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

/**
 * CitationBadge Component [FE-011]
 * Displays reference citations count with interactive drawer trigger.
 * Designed to be compact, lightweight, and non-disruptive to lesson/quiz layouts.
 */
export function CitationBadge({
  count = 0,
  onClick,
  label,
  variant = 'default',
  size = 'sm',
  className = '',
  title,
}) {
  const { t } = useTranslation();

  // If count is 0 and no explicit label, do not render
  if ((!count || count === 0) && !label) {
    return null;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  const badgeTitle = title || t('citation.badgeTitle', 'Xem tài liệu bài học tham khảo');
  const displayText = label || t('citation.sourcesCount', { count: count || 1 });

  // Size styles
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs sm:text-sm gap-2',
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  // Variant styles
  const variantClasses = {
    default:
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-xs',
    inline:
      'bg-muted/70 hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 border border-border text-[11px] font-medium rounded-md px-1.5 py-0.5',
    outline:
      'bg-transparent hover:bg-emerald-500/10 text-emerald-600 border border-emerald-500/30',
    subtle:
      'bg-transparent hover:bg-muted text-emerald-600 hover:text-emerald-700',
  }[variant] || 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={badgeTitle}
      title={badgeTitle}
      className={`inline-flex items-center shrink-0 rounded-lg font-medium cursor-pointer transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${sizeClasses} ${variantClasses} ${className}`}
    >
      <BookOpen className={size === 'xs' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span className="truncate">{displayText}</span>
    </button>
  );
}

export default CitationBadge;

