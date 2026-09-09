import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { historyApi } from '@/services/history';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { Clock, History, FileText, Target, RefreshCw } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export function HistoryListPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await historyApi.getHistory(activeWorkspace.id);
      setHistoryItems(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeWorkspace?.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">{t('history.statusApproved')}</Badge>;
      case 'REVIEWED':
        return <Badge variant="info">{t('history.statusReviewed')}</Badge>;
      default:
        return <Badge variant="neutral">{t('history.statusDraft')}</Badge>;
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('workspace.noActiveContext')}</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t('history.selectWorkspaceFirst')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('history.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('history.subtitle')} <strong className="text-foreground">{activeWorkspace.name}</strong>
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {t('history.listTitle')} ({historyItems.length})
            </CardTitle>
            <CardDescription>{t('history.listSubtitle')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="py-12">
              <Spinner message={t('history.loading')} />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('history.empty')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {t('history.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('history.table.title')}</th>
                    <th className="px-4 py-3 font-semibold">{t('history.table.type')}</th>
                    <th className="px-4 py-3 font-semibold">{t('history.table.version')}</th>
                    <th className="px-4 py-3 font-semibold">{t('history.table.status')}</th>
                    <th className="px-4 py-3 font-semibold">{t('history.table.createdAt')}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t('history.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        {item.contentType === 'LESSON_PLAN' ? (
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Target className="w-4 h-4 text-orange-500 shrink-0" />
                        )}
                        <span className="truncate max-w-[250px]" title={item.title || t('history.untitled')}>
                          {item.title || t('history.untitled')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.contentType === 'LESSON_PLAN' ? t('history.lessonPlan') : t('history.quiz')}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono bg-muted/50">v{item.version || 1}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.reviewStatus)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ExportDropdown
                          workspaceId={activeWorkspace.id}
                          generationId={item.id}
                          defaultFileName={item.title || 'bai-soan'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
