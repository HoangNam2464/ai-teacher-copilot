import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Check, Trash2, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorkspaceCard({ workspace, isActive, onSelect, onDelete }) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 hover:shadow-md flex flex-col justify-between',
        isActive ? 'border-primary ring-2 ring-primary/20 shadow-sm' : 'hover:border-border/80'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Folder className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{workspace.name}</CardTitle>
              {workspace.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {workspace.description}
                </CardDescription>
              )}
            </div>
          </div>
          {isActive && (
            <Badge variant="success" className="flex items-center gap-1 text-[11px] py-0.5">
              <Check className="w-3 h-3" />
              {t('common.active')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1.5">
          {workspace.subject && (
            <Badge variant="secondary" className="text-xs">
              {workspace.subject}
            </Badge>
          )}
          {workspace.gradeLevel && (
            <Badge variant="outline" className="text-xs">
              {workspace.gradeLevel}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant={isActive ? 'secondary' : 'default'}
          onClick={() => onSelect(workspace)}
          disabled={isActive}
          className="text-xs"
        >
          {isActive ? t('common.selected') : t('common.select')}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 text-xs px-2 h-8"
          onClick={() => onDelete(workspace.id)}
          aria-label={t('common.delete')}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
