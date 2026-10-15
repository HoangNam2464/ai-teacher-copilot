import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, BarChart3, ChevronDown, ChevronUp, Sparkles, RotateCcw } from 'lucide-react';
import {
  BloomBadge,
  normalizeBloomLevel,
  BLOOM_STANDARD_LEVELS,
  BLOOM_PROGRESS_BAR_COLOR_MAP,
} from './BloomBadge';

/**
 * BloomFilter — Toolbar and Assessment Matrix Distribution Widget.
 * Deliverable for [FE-015 / ATC-84].
 *
 * Acceptance Criteria:
 * 1. Giáo viên lọc được câu hỏi theo cấp độ nhận thức (6 mức Bloom hoặc nhóm HOT).
 * 2. Xem tỷ lệ phân bổ ma trận đề thi (số lượng và % từng cấp độ, thanh phân bổ trực quan).
 */
export function BloomFilter({
  questions = [],
  selectedFilter = 'ALL',
  onSelectFilter,
  showMatrixDefault = false,
  className = '',
}) {
  const { t } = useTranslation();
  const [showMatrix, setShowMatrix] = useState(showMatrixDefault);

  // Compute question counts and percentages per Bloom level
  const { countsByLevel, percentagesByLevel, totalCount, hotCount, foundationalCount } = useMemo(() => {
    const counts = {};
    BLOOM_STANDARD_LEVELS.forEach((lvl) => {
      counts[lvl.key] = 0;
    });

    const total = questions?.length || 0;

    (questions || []).forEach((q) => {
      const norm = normalizeBloomLevel(q?.bloom_taxonomy_level || q?.bloom_level || q?.bloomTaxonomyLevel);
      if (norm && counts[norm] !== undefined) {
        counts[norm] += 1;
      }
    });

    const percentages = {};
    BLOOM_STANDARD_LEVELS.forEach((lvl) => {
      percentages[lvl.key] = total > 0 ? Math.round((counts[lvl.key] / total) * 100) : 0;
    });

    const hot = (counts.analyze || 0) + (counts.evaluate || 0) + (counts.create || 0);
    const foundational = (counts.remember || 0) + (counts.understand || 0);

    return {
      countsByLevel: counts,
      percentagesByLevel: percentages,
      totalCount: total,
      hotCount: hot,
      foundationalCount: foundational,
    };
  }, [questions]);

  // Active levels present in the dataset
  const activeLevels = useMemo(() => {
    return BLOOM_STANDARD_LEVELS.filter((lvl) => countsByLevel[lvl.key] > 0);
  }, [countsByLevel]);

  const isHotSelected = selectedFilter === 'HOT';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Filter Bar */}
      <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Filter Buttons */}
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
              {totalCount}
            </span>
          </button>

          {/* Dynamic Bloom Level Chips */}
          {activeLevels.map((lvl) => {
            const count = countsByLevel[lvl.key] || 0;
            const isActive = selectedFilter === lvl.key;

            return (
              <BloomBadge
                key={lvl.key}
                level={lvl.en}
                count={count}
                active={isActive}
                interactive={true}
                onClick={() => onSelectFilter(isActive ? 'ALL' : lvl.key)}
                className="py-1 cursor-pointer"
              />
            );
          })}

          {/* Higher-Order Thinking (HOT) Filter Chip */}
          {hotCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectFilter(isHotSelected ? 'ALL' : 'HOT')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all select-none cursor-pointer border ${
                isHotSelected
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border-transparent shadow-xs ring-2 ring-orange-500/30'
                  : 'bg-background hover:bg-muted text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60'
              }`}
              title={t('quizGenerator.hotFilterTooltip', 'Lọc nhóm tư duy bậc cao (Phân tích, Đánh giá, Sáng tạo)')}
            >
              <Sparkles className="w-3 h-3" />
              <span>{t('quizGenerator.hotFilter', 'Tư duy bậc cao (HOT)')}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  isHotSelected ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                }`}
              >
                {hotCount}
              </span>
            </button>
          )}
        </div>

        {/* Right: Matrix View Toggle */}
        <button
          type="button"
          onClick={() => setShowMatrix((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            showMatrix
              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'
          }`}
          title={showMatrix ? t('quizGenerator.hideMatrix', 'Ẩn ma trận') : t('quizGenerator.viewMatrix', 'Xem ma trận đề')}
        >
          <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
          <span>{t('quizGenerator.matrixDistribution', 'Ma trận đề')}</span>
          {showMatrix ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>
      </div>

      {/* Assessment Matrix Distribution Widget */}
      {showMatrix && totalCount > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {t('quizGenerator.matrixTitle', 'Ma trận phân bổ câu hỏi theo Thang đo Bloom')}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {t('quizGenerator.matrixSubtitle', 'Tỷ lệ câu hỏi giúp giáo viên cân đối giữa nhận thức cơ bản và tư duy bậc cao')}
                </p>
              </div>
            </div>

            {/* Quick summary ratios */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {t('quizGenerator.foundationalLabel', 'Cơ bản')}: {totalCount > 0 ? Math.round((foundationalCount / totalCount) * 100) : 0}% ({foundationalCount} câu)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {t('quizGenerator.hotLabel', 'Tư duy nâng cao')}: {totalCount > 0 ? Math.round((hotCount / totalCount) * 100) : 0}% ({hotCount} câu)
              </span>
            </div>
          </div>

          {/* Segmented Stacked Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex border border-border/60 p-0.5 gap-0.5">
              {BLOOM_STANDARD_LEVELS.map((lvl) => {
                const count = countsByLevel[lvl.key] || 0;
                if (count === 0) return null;
                const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
                const barColor = BLOOM_PROGRESS_BAR_COLOR_MAP[lvl.key] || 'bg-primary';

                return (
                  <div
                    key={lvl.key}
                    style={{ width: `${pct}%` }}
                    className={`${barColor} h-full rounded-xs transition-all hover:opacity-85 cursor-pointer`}
                    title={`${lvl.vi} (${lvl.en}): ${count} câu (${Math.round(pct)}%)`}
                    onClick={() => onSelectFilter(selectedFilter === lvl.key ? 'ALL' : lvl.key)}
                  />
                );
              })}
            </div>
          </div>

          {/* Detailed 6-Level Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {BLOOM_STANDARD_LEVELS.map((lvl) => {
              const count = countsByLevel[lvl.key] || 0;
              const pct = percentagesByLevel[lvl.key] || 0;
              const isActive = selectedFilter === lvl.key;

              return (
                <button
                  key={lvl.key}
                  type="button"
                  onClick={() => onSelectFilter(isActive ? 'ALL' : lvl.key)}
                  className={`p-2.5 rounded-lg border text-left transition-all select-none cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isActive
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'border-border/70 hover:border-border hover:bg-muted/30 bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      {lvl.vi}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      L{lvl.levelNum}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between w-full mt-1">
                    <span className="text-sm font-bold text-foreground">
                      {count} <span className="text-[10px] font-normal text-muted-foreground">{t('quizGenerator.questionsUnit', 'câu')}</span>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
