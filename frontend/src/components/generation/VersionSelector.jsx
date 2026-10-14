import React from 'react';
import { useTranslation } from 'react-i18next';
import { History, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * VersionSelector — Interactive version picker & regeneration trigger (FE-016 / ATC-403).
 * Allows switching between historical content versions without data loss.
 */
export function VersionSelector({
  versions = [],
  currentVersion = 1,
  onSelectVersion,
  onOpenRegenerate,
  disabled = false,
  className = '',
}) {
  const { t } = useTranslation();

  const totalVersions = versions.length;

  return (
    <div className={`inline-flex items-center gap-2 flex-wrap ${className}`}>
      {/* Version Tabs / Pills */}
      {totalVersions > 1 ? (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/70 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground px-1.5 font-medium">
            <History className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="hidden sm:inline">{t('generation.version', 'Bản')}:</span>
          </span>

          {versions.map((ver) => {
            const isSelected = ver.version === currentVersion;
            return (
              <button
                key={ver.version}
                type="button"
                disabled={disabled}
                onClick={() => onSelectVersion(ver)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
                title={
                  ver.instructions
                    ? `v${ver.version}: ${ver.instructions}`
                    : `v${ver.version} (${t('generation.originalVersion', 'Bản gốc')})`
                }
              >
                v{ver.version}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/60 text-xs text-muted-foreground">
          <History className="w-3.5 h-3.5 text-orange-500" />
          <span>{t('generation.version', 'Bản')}:</span>
          <strong className="text-foreground font-semibold">v{currentVersion}</strong>
        </div>
      )}

      {/* Regenerate Button */}
      {onOpenRegenerate && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onOpenRegenerate}
          className="h-8 gap-1.5 text-xs font-medium border-orange-500/30 hover:bg-orange-500/10 hover:border-orange-500/50 text-foreground transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>{t('generation.regenerateBtn', 'Tạo lại với AI')}</span>
        </Button>
      )}
    </div>
  );
}
