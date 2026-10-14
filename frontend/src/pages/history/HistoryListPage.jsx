import React, { useState, useEffect, useMemo } from 'react';
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
import { VersionTimeline } from '@/components/history/VersionTimeline';
import { ContentPreviewModal } from '@/components/history/ContentPreviewModal';
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
  Search,
  Filter,
  GitBranch,
  Eye,
  CheckCircle2,
  ChevronRight,
  X,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export function HistoryListPage() {
  const { t } = useTranslation();
  const { activeWorkspace, isInitialized, isLoading: isWorkspaceLoading } = useWorkspaceStore();

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'LESSON_PLAN' | 'QUIZ'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'DRAFT' | 'REVIEWED' | 'APPROVED'

  // Version Lineage Tree State (FE-017 / ATC-404)
  const [selectedItem, setSelectedItem] = useState(null);
  const [lineageVersions, setLineageVersions] = useState([]);
  const [loadingLineage, setLoadingLineage] = useState(false);
  const [isLineageOpen, setIsLineageOpen] = useState(false);

  // Content Preview Modal State
  const [previewItem, setPreviewItem] = useState(null);

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await historyApi.getHistory(activeWorkspace.id);
      const items = Array.isArray(data) ? data : data?.data || [];
      setHistoryItems(items);

      // If an item was selected, keep lineage in sync
      if (selectedItem) {
        const updated = items.find((i) => i.id === selectedItem.id);
        if (updated) setSelectedItem(updated);
      }
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
      setSelectedItem(null);
      setLineageVersions([]);
      setIsLineageOpen(false);
    }
  }, [activeWorkspace?.id]);

  // Load version lineage tree for a specific content item
  const handleOpenLineage = async (item) => {
    if (!activeWorkspace?.id || !item) return;
    setSelectedItem(item);
    setIsLineageOpen(true);

    try {
      setLoadingLineage(true);
      const res = await historyApi.getVersions(activeWorkspace.id, item.id);
      const versions = Array.isArray(res) ? res : res?.data || [item];
      setLineageVersions(versions.length > 0 ? versions : [item]);
    } catch (err) {
      console.warn('Could not load versions from backend, falling back to local item:', err);
      // Fallback: collect related items from historyItems with matching parentId or root
      const rootId = item.parentId || item.id;
      const related = historyItems.filter(
        (h) => h.id === rootId || h.parentId === rootId
      );
      setLineageVersions(related.length > 0 ? related : [item]);
    } finally {
      setLoadingLineage(false);
    }
  };

  // Change review status for a specific version
  const handleUpdateStatus = async (versionId, newStatus) => {
    if (!activeWorkspace?.id || !versionId) return;
    try {
      await historyApi.updateReviewStatus(activeWorkspace.id, versionId, newStatus);

      // Update in-memory state
      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === versionId ? { ...item, reviewStatus: newStatus } : item
        )
      );
      setLineageVersions((prev) =>
        prev.map((ver) =>
          ver.id === versionId ? { ...ver, reviewStatus: newStatus } : ver
        )
      );
      if (selectedItem?.id === versionId) {
        setSelectedItem((prev) => (prev ? { ...prev, reviewStatus: newStatus } : null));
      }

      toast.success(
        t('history.statusUpdated', `Đã cập nhật trạng thái sang "${newStatus}"!`)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await historyApi.deleteHistoryItem(itemToDelete.id);
      setHistoryItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      setLineageVersions((prev) => prev.filter((i) => i.id !== itemToDelete.id));
      if (selectedItem?.id === itemToDelete.id) {
        setSelectedItem(null);
        setIsLineageOpen(false);
      }
      toast.success(t('common.success', 'Đã xóa bản ghi thành công!'));
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete history item:', err);
      toast.error(err.response?.data?.message || 'Xóa bản ghi thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered and searched list
  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Type filter
      if (typeFilter !== 'ALL' && item.contentType !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && item.reviewStatus !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const topicMatch = (item.topic || '').toLowerCase().includes(query);
        const subjectMatch = (item.subject || '').toLowerCase().includes(query);
        return titleMatch || topicMatch || subjectMatch;
      }
      return true;
    });
  }, [historyItems, typeFilter, statusFilter, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = historyItems.length;
    const lessonPlans = historyItems.filter((i) => i.contentType === 'LESSON_PLAN').length;
    const quizzes = historyItems.filter((i) => i.contentType === 'QUIZ').length;
    const approved = historyItems.filter((i) => i.reviewStatus === 'APPROVED').length;
    return { total, lessonPlans, quizzes, approved };
  }, [historyItems]);

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-muted/20 border-border/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('history.statsTotalDocs', 'Tổng bài soạn')}</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{stats.total}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">{t('history.filterLessonPlans', 'Giáo án')}</p>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{stats.lessonPlans}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-orange-50/40 dark:bg-orange-950/20 border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-800 dark:text-orange-300">{t('history.filterQuizzes', 'Đề kiểm tra')}</p>
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-200 mt-1">{stats.quizzes}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-blue-50/40 dark:bg-blue-950/20 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 dark:text-blue-300">{t('history.statusApproved', 'Đã duyệt')}</p>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-1">{stats.approved}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder', 'Tìm kiếm theo tên bài dạy, đề thi...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills & Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter Buttons */}
            <div className="inline-flex items-center p-1 rounded-lg bg-muted/60 border border-border/80 text-xs">
              {[
                { id: 'ALL', label: t('history.filterAll', 'Tất cả') },
                { id: 'LESSON_PLAN', label: t('history.filterLessonPlans', 'Giáo án') },
                { id: 'QUIZ', label: t('history.filterQuizzes', 'Đề kiểm tra') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    typeFilter === tab.id
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Review Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">{t('history.filterAllStatus', 'Tất cả trạng thái')}</option>
              <option value="DRAFT">{t('history.statusDraft', 'Bản thảo')}</option>
              <option value="REVIEWED">{t('history.statusReviewed', 'Đã xem xét')}</option>
              <option value="APPROVED">{t('history.statusApproved', 'Đã duyệt')}</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={loadHistory}
              disabled={loading}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('common.refresh', 'Làm mới')}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Layout: Table & Lineage Tree Split View */}
      <div className={`grid gap-6 ${isLineageOpen ? 'lg:grid-cols-[1.2fr_1fr]' : 'grid-cols-1'}`}>
        {/* History List Table */}
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                {t('history.listTitle', 'Danh sách nội dung đã tạo')} ({filteredItems.length})
              </CardTitle>
              <CardDescription className="text-xs">
                {t('history.listSubtitle', 'Lưu trữ các phiên bản giáo án, đề kiểm tra kèm nguồn trích dẫn.')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="py-16">
                <Spinner message={t('history.loading', 'Đang tải lịch sử bài soạn...')} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center p-6">
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">{t('history.table.title', 'Tên nội dung')}</th>
                      <th className="px-3 py-3">{t('history.table.type', 'Loại')}</th>
                      <th className="px-3 py-3">{t('history.table.version', 'Phiên bản')}</th>
                      <th className="px-3 py-3">{t('history.table.status', 'Trạng thái')}</th>
                      <th className="px-3 py-3">{t('history.table.createdAt', 'Thời gian')}</th>
                      <th className="px-4 py-3 text-right">{t('history.table.actions', 'Thao tác')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((item) => {
                      const isItemActive = selectedItem?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenLineage(item)}
                          className={`cursor-pointer transition-colors ${
                            isItemActive
                              ? 'bg-primary/5 hover:bg-primary/10'
                              : 'hover:bg-muted/40'
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              {item.contentType === 'LESSON_PLAN' ? (
                                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Target className="w-4 h-4 text-orange-500 shrink-0" />
                              )}
                              <span
                                className="truncate max-w-[200px] sm:max-w-[240px] font-medium"
                                title={item.title || t('history.untitled', 'Chưa đặt tên')}
                              >
                                {item.title || t('history.untitled', 'Chưa đặt tên')}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                            {item.contentType === 'LESSON_PLAN'
                              ? t('history.lessonPlan', 'Giáo án')
                              : t('history.quiz', 'Đề kiểm tra')}
                          </td>

                          <td className="px-3 py-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLineage(item);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border transition-colors cursor-pointer"
                              title={t('history.viewLineage', 'Xem phả hệ phiên bản')}
                            >
                              <GitBranch className="w-3 h-3 text-orange-500" />
                              <span>v{item.version || 1}</span>
                            </button>
                          </td>

                          <td className="px-3 py-3 whitespace-nowrap">
                            {getStatusBadge(item.reviewStatus)}
                          </td>

                          <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => handleOpenLineage(item)}
                                title={t('history.viewLineage', 'Xem phả hệ')}
                              >
                                <GitBranch className="w-3.5 h-3.5 text-orange-500" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setPreviewItem(item)}
                                title={t('history.previewBtn', 'Xem nội dung')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              <ExportDropdown
                                workspaceId={activeWorkspace.id}
                                generationId={item.id}
                                defaultFileName={`${item.contentType === 'QUIZ' ? 'de-thi' : 'giao-an'}-${item.title || 'bai-soan'}-v${item.version || 1}`}
                                planData={item.contentData || item.content}
                                contentType={item.contentType}
                                subject={item.subject || activeWorkspace?.subject || ''}
                                gradeLevel={item.gradeLevel || activeWorkspace?.gradeLevel || ''}
                              />

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title={t('common.delete', 'Xóa')}
                                onClick={() => setItemToDelete(item)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Version Lineage Tree Panel */}
        {isLineageOpen && selectedItem && (
          <Card className="h-fit sticky top-24 border-primary/30 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20 border-b border-border/60">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-orange-500" />
                  <span>{t('history.lineageTreeTitle', 'Phả hệ phiên bản')}</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground truncate max-w-[260px]">
                  {selectedItem.title || t('history.untitled', 'Chưa đặt tên')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLineageOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title={t('common.close', 'Đóng')}
              >
                <X className="w-4 h-4" />
              </button>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {loadingLineage ? (
                <div className="py-12">
                  <Spinner message={t('common.loading', 'Đang tải phả hệ phiên bản...')} />
                </div>
              ) : (
                <VersionTimeline
                  versions={lineageVersions}
                  selectedVersionId={selectedItem?.id}
                  onSelectVersion={(ver) => setSelectedItem(ver)}
                  onUpdateStatus={handleUpdateStatus}
                  onPreviewContent={(ver) => setPreviewItem(ver)}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content Preview Modal */}
      <ContentPreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        item={previewItem}
        workspaceId={activeWorkspace?.id}
      />

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
