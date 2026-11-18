import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitCommit,
  GitBranch,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Star,
  FileText,
  Target,
  Eye,
  Check,
  ChevronRight,
  MessageSquareQuote,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/formatters';

/**
 * VersionTimeline — Interactive Version Lineage Tree (FE-017 / ATC-404).
 * Visualizes parent-child relationships between content versions, supports version selection
 * and review status transitions.
 */
export function VersionTimeline({
  versions = [],
  selectedVersionId,
  onSelectVersion,
  onUpdateStatus,
  onPreviewContent,
  isLoading = false,
  className = '',
}) {
  const { t } = useTranslation();

  if (!versions || versions.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/20 text-xs text-muted-foreground">
        {t('history.noVersions', 'Chưa có thông tin phiên bản.')}
      </div>
    );
  }

  // Sort versions by version number ascending (v1 -> v2 -> v3)
  const sortedVersions = [...versions].sort((a, b) => {
    const vA = Number(a.version) || 1;
    const vB = Number(b.version) || 1;
    return vA - vB;
  });

  const rootVersion = sortedVersions[0];
  const latestVersion = sortedVersions[sortedVersions.length - 1];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {t('history.statusApproved', 'Đã duyệt')}
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            {t('history.statusReviewed', 'Đã xem xét')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
            <Clock className="w-3 h-3" />
            {t('history.statusDraft', 'Bản thảo')}
          </span>
        );
      }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Lineage Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>{t('history.lineageTreeTitle', 'Phả hệ phiên bản')}</span>
              <span className="text-xs font-normal text-muted-foreground">
                ({sortedVersions.length} {t('history.versionCount', 'bản')})
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {t('history.lineageTreeSubtitle', 'Quan hệ kế thừa từ bản gốc đến các bản tinh chỉnh tiếp theo.')}
            </p>
          </div>
        </div>

        {/* Selected Version Indicator */}
        {selectedVersionId && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>
              {t('history.activeVersion', 'Đang chọn')}:{' '}
              <strong>v{sortedVersions.find((v) => v.id === selectedVersionId)?.version || 1}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Tree Timeline Container */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-orange-400 before:to-primary">
        {sortedVersions.map((ver, idx) => {
          const isSelected = ver.id === selectedVersionId;
          const isRoot = idx === 0;
          const isLatest = ver.id === latestVersion?.id;
          const verNumber = ver.version || idx + 1;

          // Extract prompt / refinement notes if any
          let refinementNote = null;
          if (ver.promptInput && ver.promptInput.includes('[Refinement]:')) {
            refinementNote = ver.promptInput.split('[Refinement]:')[1]?.trim();
          } else if (ver.instructions) {
            refinementNote = ver.instructions;
          }

          return (
            <div
              key={ver.id || idx}
              onClick={() => onSelectVersion && onSelectVersion(ver)}
              className={`relative group rounded-xl p-3.5 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-card border-primary shadow-md ring-2 ring-primary/20'
                  : 'bg-card/70 hover:bg-card border-border/80 hover:border-orange-500/40 shadow-xs'
              }`}
            >
              {/* Tree Node Dot / Icon */}
              <div
                className={`absolute -left-[1.85rem] sm:-left-[2.1rem] top-3.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                    : isLatest
                    ? 'bg-amber-500 text-white'
                    : isRoot
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground border border-border group-hover:border-primary'
                }`}
              >
                {isLatest ? (
                  <Star className="w-3 h-3 fill-current" />
                ) : isRoot ? (
                  <Sparkles className="w-3 h-3" />
                ) : (
                  <GitCommit className="w-3 h-3" />
                )}
              </div>

              {/* Version Card Content */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Version Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/80 text-foreground border border-border'
                      }`}
                    >
                      v{verNumber}
                    </span>

                    {/* Hierarchy Tags */}
                    {isRoot && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        🌱 {t('history.rootVersion', 'Bản gốc')}
                      </span>
                    )}

                    {isLatest && sortedVersions.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        ⭐ {t('history.latestVersion', 'Mới nhất')}
                      </span>
                    )}

                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/30">
                        ✓ {t('history.currentSelected', 'Đang chọn')}
                      </span>
                    )}

                    {/* Review Status Badge */}
                    {getStatusBadge(ver.reviewStatus)}
                  </div>

                  {/* Title & Created Time */}
                  <div className="text-xs text-foreground font-semibold flex items-center gap-1.5 pt-0.5">
                    {ver.contentType === 'LESSON_PLAN' ? (
                      <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Target className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    )}
                    <span className="truncate max-w-[280px]">
                      {ver.title || t('history.untitled', 'Chưa đặt tên')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ver.createdAt)}
                    </span>
                    {ver.parentId && (
                      <span className="text-[10px] font-mono opacity-80">
                        parent: {String(ver.parentId).slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions & Status Changer for Selected Node */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                  {onPreviewContent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVersion && onSelectVersion(ver);
                        onPreviewContent(ver);
                      }}
                      className="h-7 text-xs gap-1 border-border/80 hover:bg-muted"
                    >
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span>{t('history.previewBtn', 'Xem nội dung')}</span>
                    </Button>
                  )}

                  {onUpdateStatus && isSelected && (
                    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/60">
                      {['DRAFT', 'REVIEWED', 'APPROVED'].map((status) => {
                        const active = ver.reviewStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(ver.id, status);
                            }}
                            className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                              active
                                ? status === 'APPROVED'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : status === 'REVIEWED'
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-foreground text-background font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title={`Chuyển trạng thái sang ${status}`}
                          >
                            {status === 'APPROVED'
                              ? 'Duyệt'
                              : status === 'REVIEWED'
                              ? 'Đã xem'
                              : 'Thảo'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Refinement Prompt / Teacher Instruction Note */}
              {refinementNote && (
                <div className="mt-2.5 pt-2 border-t border-dashed border-border/60 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="text-foreground font-medium">
                      {t('history.refinementPrompt', 'Chỉ dẫn tạo lại')}:
                    </strong>{' '}
                    {refinementNote}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
