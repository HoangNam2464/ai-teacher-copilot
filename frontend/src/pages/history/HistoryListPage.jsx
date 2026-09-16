import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { historyApi } from '@/services/history';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ExportDropdown } from '@/components/export/ExportDropdown';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { PATHS } from '@/routes/paths';
import {
  Clock,
  History,
  FileText,
  Target,
  RefreshCw,
  Trash2,
  FolderOpen,
  Plus,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export function HistoryListPage() {
  const { t } = useTranslation();
  const { activeWorkspace, isInitialized, isLoading: isWorkspaceLoading } = useWorkspaceStore();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await historyApi.getHistory(activeWorkspace.id);
      setHistoryItems(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.warn('Could not load history or endpoint empty:', err);
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadHistory();
    }
  }, [activeWorkspace?.id]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await historyApi.deleteHistoryItem(itemToDelete.id);
      setHistoryItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      toast.success(t('common.success', 'Đã xóa bản ghi thành công!'));
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete history item:', err);
      toast.error(err.response?.data?.message || 'Xóa bản ghi thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {t('history.statusApproved', 'Đã duyệt')}
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {t('history.statusReviewed', 'Đã xem xét')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            {t('history.statusDraft', 'Bản thảo')}
          </span>
        );
    }
  };

  // Initial loading spinner
  if (isWorkspaceLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner message={t('common.loading', 'Đang tải dữ liệu...')} />
      </div>
    );
  }

  // If no active workspace
  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
          <History className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">
          {t('workspace.noActiveContext', 'Chưa chọn không gian làm việc')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mb-6">
          {t('history.selectWorkspaceFirst', 'Vui lòng chọn hoặc tạo một không gian làm việc để xem lịch sử soạn giáo án và đề thi.')}
        </p>
        <Link to={PATHS.WORKSPACES}>
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium shadow-md shadow-emerald-500/15">
            <Plus className="w-4 h-4" />
            {t('workspace.createFirst', 'Quản lý không gian làm việc')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('history.title', 'Lịch sử & Phả hệ nội dung')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('history.subtitle', 'Theo dõi và quản lý các giáo án, đề kiểm tra đã được AI tạo trong')}{' '}
            <strong className="text-foreground">{activeWorkspace.name}</strong>
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs text-muted-foreground w-fit">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span>{t('workspace.title', 'Không gian')}:</span>
          <strong className="text-foreground font-semibold">{activeWorkspace.name}</strong>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              {t('history.listTitle', 'Danh sách nội dung đã tạo')} ({historyItems.length})
            </CardTitle>
            <CardDescription className="text-xs">
              {t('history.listSubtitle', 'Lưu trữ các phiên bản giáo án, đề kiểm tra kèm nguồn trích dẫn.')}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={loading}
            className="gap-2 h-9 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh', 'Làm mới')}
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12">
              <Spinner message={t('history.loading', 'Đang tải lịch sử...')} />
            </div>
          ) : historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                <Clock className="w-7 h-7 text-muted-foreground/70" />
              </div>
              <h3 className="text-base font-semibold mb-1 text-foreground">
                {t('history.empty', 'Chưa có nội dung nào được tạo')}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
                {t(
                  'history.emptyDesc',
                  'Bạn chưa tạo giáo án hoặc đề kiểm tra nào trong không gian này. Hãy dùng các công cụ AI để bắt đầu soạn bài!'
                )}
              </p>
              <div className="flex items-center gap-3">
                <Link to={PATHS.LESSON_PLANNER}>
                  <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('nav.lessonPlanner', 'Soạn giáo án')}
                  </Button>
                </Link>
                <Link to={PATHS.QUIZ_GENERATOR}>
                  <Button size="sm" variant="outline" className="gap-2 text-xs border-orange-500/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                    <Target className="w-3.5 h-3.5" />
                    {t('nav.quizGenerator', 'Tạo bài tập')}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{t('history.table.title', 'Tên nội dung')}</th>
                    <th className="px-4 py-3">{t('history.table.type', 'Loại')}</th>
                    <th className="px-4 py-3">{t('history.table.version', 'Phiên bản')}</th>
                    <th className="px-4 py-3">{t('history.table.status', 'Trạng thái')}</th>
                    <th className="px-4 py-3">{t('history.table.createdAt', 'Thời gian')}</th>
                    <th className="px-4 py-3 text-right">{t('history.table.actions', 'Thao tác')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historyItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {item.contentType === 'LESSON_PLAN' ? (
                            <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Target className="w-4 h-4 text-orange-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[260px] font-medium" title={item.title || t('history.untitled', 'Chưa đặt tên')}>
                            {item.title || t('history.untitled', 'Chưa đặt tên')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.contentType === 'LESSON_PLAN'
                          ? t('history.lessonPlan', 'Giáo án')
                          : t('history.quiz', 'Đề kiểm tra')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted text-muted-foreground border border-border">
                          v{item.version || 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.reviewStatus)}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <ExportDropdown
                            workspaceId={activeWorkspace.id}
                            generationId={item.id}
                            defaultFileName={item.title || 'bai-soan'}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title={t('common.delete', 'Xóa')}
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
        title={t('history.deleteTitle', 'Xóa bản ghi lịch sử')}
        description={t(
          'history.deleteDesc',
          `Bạn có chắc chắn muốn xóa bản ghi "${itemToDelete?.title || 'này'}"? Thao tác này không thể hoàn tác.`
        )}
      />
    </div>
  );
}
