import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, RotateCcw } from 'lucide-react';
import { BloomTaxonomyTag, normalizeBloomLevel } from '@/components/ui/BloomTaxonomyTag';

const STANDARD_BLOOM_LEVELS = [
  { key: 'remember', defaultLabel: 'Nhận biết', englishLabel: 'Remember' },
  { key: 'understand', defaultLabel: 'Thông hiểu', englishLabel: 'Understand' },
  { key: 'apply', defaultLabel: 'Vận dụng', englishLabel: 'Apply' },
  { key: 'analyze', defaultLabel: 'Phân tích', englishLabel: 'Analyze' },
  { key: 'evaluate', defaultLabel: 'Đánh giá', englishLabel: 'Evaluate' },
  { key: 'create', defaultLabel: 'Sáng tạo', englishLabel: 'Create' },
];

/**
 * BloomFilterBar — Toolbar for filtering quiz questions by Bloom's Taxonomy level.
 * Shows question count per level and preserves full quiz dataset in memory.
 */
export function BloomFilterBar({
  questions = [],
  selectedFilter = 'ALL',
  onSelectFilter,
  className = '',
}) {
  const { t } = useTranslation();

  // Compute counts per normalized Bloom level
  const countsByLevel = useMemo(() => {
    const counts = {};
    STANDARD_BLOOM_LEVELS.forEach((lvl) => {
      counts[lvl.key] = 0;
    });

    (questions || []).forEach((q) => {
      const norm = normalizeBloomLevel(q?.bloom_taxonomy_level);
      if (norm && counts[norm] !== undefined) {
        counts[norm] += 1;
      }
    });

    return counts;
  }, [questions]);

  const totalQuestions = questions?.length || 0;

  // Filter only levels present in the questions, or show all if desired
  const activeLevels = useMemo(() => {
    return STANDARD_BLOOM_LEVELS.filter((lvl) => countsByLevel[lvl.key] > 0);
  }, [countsByLevel]);

  const isFiltered = selectedFilter !== 'ALL';
  const filteredCount = isFiltered ? (countsByLevel[selectedFilter] || 0) : totalQuestions;

  return (
    <div
      className={`p-3 rounded-xl bg-muted/40 border border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs ${className}`}
    >
      {/* Left side: Filter Label & Level Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground mr-1">
          <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span>{t('quizGenerator.filterBloom', 'Lọc Bloom')}:</span>
        </span>

        {/* 'All' Chip */}
        <button
          type="button"
          onClick={() => onSelectFilter('ALL')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all select-none cursor-pointer border ${
            selectedFilter === 'ALL'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20'
              : 'bg-background hover:bg-muted text-muted-foreground border-border'
          }`}
        >
          <span>{t('quizGenerator.allLevels', 'Tất cả')}</span>
          <span
            className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              selectedFilter === 'ALL'
                ? 'bg-white/20 text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}
          >
            {totalQuestions}
          </span>
        </button>

        {/* Dynamic Bloom Level Chips */}
        {activeLevels.map((lvl) => {
          const count = countsByLevel[lvl.key] || 0;
          const isActive = selectedFilter === lvl.key;

          return (
            <BloomTaxonomyTag
              key={lvl.key}
              level={lvl.englishLabel}
              count={count}
              active={isActive}
              interactive={true}
              onClick={() => onSelectFilter(isActive ? 'ALL' : lvl.key)}
              className="py-1 cursor-pointer"
            />
          );
        })}
      </div>

      {/* Right side: Count & Clear Filter Action */}
      <div className="flex items-center gap-2 ml-auto">
        {isFiltered ? (
          <>
            <span className="text-muted-foreground font-medium">
              {t('quizGenerator.filterShowing', {
                count: filteredCount,
                total: totalQuestions,
                defaultValue: `Hiển thị ${filteredCount}/${totalQuestions} câu`,
              })}
            </span>
            <button
              type="button"
              onClick={() => onSelectFilter('ALL')}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={t('quizGenerator.clearFilter', 'Xóa bộ lọc')}
            >
              <RotateCcw className="w-3 h-3 text-orange-500" />
              <span>{t('quizGenerator.clearFilter', 'Xem tất cả')}</span>
            </button>
          </>
        ) : (
          <span className="text-muted-foreground">
            {totalQuestions} {t('quizGenerator.questionsUnit', 'câu hỏi')}
          </span>
        )}
      </div>
    </div>
  );
}
