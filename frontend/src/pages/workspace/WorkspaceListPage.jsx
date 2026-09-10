import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import {
  Plus,
  Search,
  FolderOpen,
  FileText,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  BookOpen,
} from 'lucide-react';

function WorkspaceCardItem({
  workspace,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-card border rounded-xl p-5 hover:border-green-500/50 hover:shadow-sm transition-all group flex flex-col justify-between relative ${
        isActive ? 'border-green-500/60 ring-1 ring-green-500/20 bg-green-500/[0.02]' : 'border-border'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isActive ? 'bg-green-500/20 text-green-600' : 'bg-green-500/10 text-green-600 group-hover:bg-green-500/20'
              }`}
            >
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3
                onClick={() => onSelect(workspace)}
                className="font-semibold text-base hover:text-green-600 transition-colors cursor-pointer truncate"
                title={workspace.name}
              >
                {workspace.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('common.selected', 'Đang hoạt động')}
                  </span>
                ) : (
                  <button
                    onClick={() => onSelect(workspace)}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    {t('common.select', 'Chọn không gian')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3-dots action menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-80 group-hover:opacity-100"
              aria-label="Tùy chọn không gian"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-50 py-1 animate-fade-in">
                  {!isActive && (
                    <button
                      onClick={() => {
                        onSelect(workspace);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {t('common.select', 'Chọn làm chính')}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onEdit(workspace);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                    {t('common.edit', 'Chỉnh sửa')}
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      onDelete(workspace);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 text-red-600 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete', 'Xóa')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {workspace.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {workspace.description}
          </p>
        )}
      </div>

      {/* Footer info: tags & doc counts */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1.5 flex-wrap">
          {workspace.subject && (
            <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground font-medium">
              {workspace.subject}
            </span>
          )}
          {workspace.gradeLevel && (
            <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground font-medium">
              {workspace.gradeLevel}
            </span>
          )}
        </div>

        {workspace.documentCount !== undefined ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <FileText className="w-3.5 h-3.5" />
            {workspace.documentCount} {t('nav.documents', 'tài liệu')}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
            Kho học liệu
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function WorkspaceListPage() {
  const { t } = useTranslation();
  const {
    workspaces,
    activeWorkspace,
    isLoading,
    isInitialized,
    fetchWorkspaces,
    setActiveWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formGradeLevel, setFormGradeLevel] = useState('');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Extract unique subjects for filtering
  const subjects = useMemo(() => {
    const set = new Set();
    workspaces.forEach((w) => {
      if (w.subject?.trim()) set.add(w.subject.trim());
    });
    return Array.from(set);
  }, [workspaces]);

  // Filter workspaces based on search query & subject
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((w) => {
      const matchSearch =
        !searchQuery.trim() ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.gradeLevel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSubject =
        selectedSubject === 'ALL' ||
        w.subject?.trim().toLowerCase() === selectedSubject.toLowerCase();

      return matchSearch && matchSubject;
    });
  }, [workspaces, searchQuery, selectedSubject]);

  const handleOpenCreateModal = () => {
    setEditingWorkspace(null);
    setFormName('');
    setFormSubject('');
    setFormGradeLevel('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (workspace) => {
    setEditingWorkspace(workspace);
    setFormName(workspace.name || '');
    setFormSubject(workspace.subject || '');
    setFormGradeLevel(workspace.gradeLevel || '');
    setFormDescription(workspace.description || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error(t('workspace.nameRequired', 'Vui lòng nhập tên không gian'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, {
          name: formName.trim(),
          subject: formSubject.trim(),
          gradeLevel: formGradeLevel.trim(),
          description: formDescription.trim(),
        });
        toast.success(t('common.success', 'Đã cập nhật không gian làm việc'));
      } else {
        await createWorkspace({
          name: formName.trim(),
          subject: formSubject.trim(),
          gradeLevel: formGradeLevel.trim(),
          description: formDescription.trim(),
        });
        toast.success(t('workspace.createSuccess', 'Đã tạo không gian làm việc mới'));
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || t('common.error', 'Đã xảy ra lỗi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (workspace) => {
    setActiveWorkspace(workspace);
    toast.success(`${t('workspace.activeContext', 'Đã chọn không gian: ')} ${workspace.name}`);
  };

  const handleOpenDeleteModal = (workspace) => {
    setWorkspaceToDelete(workspace);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(workspaceToDelete.id);
      toast.success(t('workspace.deleteSuccess', 'Đã xóa không gian làm việc'));
      setDeleteModalOpen(false);
      setWorkspaceToDelete(null);
    } catch {
      toast.error(t('workspace.errorDelete', 'Xóa không gian thất bại'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            {t('workspace.title', 'Không gian làm việc')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('workspace.subtitle', 'Quản lý và phân nhóm tài liệu giảng dạy theo lớp và môn học')}
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('workspace.create', 'Tạo không gian mới')}
        </Button>
      </div>

      {/* Search and Subject filter bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search', 'Tìm kiếm không gian...') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
          />
        </div>

        {subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedSubject('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedSubject === 'ALL'
                  ? 'bg-green-600 text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả ({workspaces.length})
            </button>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedSubject === sub
                    ? 'bg-green-600 text-white'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Workspaces */}
      {isLoading && !isInitialized ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="w-8 h-8 text-green-600" />
        </div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? t('common.noResults', 'Không tìm thấy không gian phù hợp') : t('workspace.empty', 'Chưa có không gian làm việc nào')}
          </h3>
          <p className="text-muted-foreground mb-5 text-sm max-w-md mx-auto">
            {searchQuery
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.'
              : t('workspace.emptyDesc', 'Tạo không gian làm việc đầu tiên để bắt đầu tải tài liệu và soạn giáo án.')}
          </p>
          {!searchQuery && (
            <Button onClick={handleOpenCreateModal} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('workspace.createFirst', 'Tạo không gian ngay')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkspaces.map((workspace) => (
            <WorkspaceCardItem
              key={workspace.id}
              workspace={workspace}
              isActive={activeWorkspace?.id === workspace.id}
              onSelect={handleSelect}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Workspace Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6 z-50"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold">
                    {editingWorkspace
                      ? t('workspace.editTitle', 'Chỉnh sửa không gian làm việc')
                      : t('workspace.createTitle', 'Tạo không gian giảng dạy mới')}
                  </h2>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('workspace.name', 'Tên không gian')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t('workspace.namePlaceholder', 'Ví dụ: Toán 10 — Năm học 2026')}
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t('workspace.subject', 'Môn học')}
                    </label>
                    <input
                      type="text"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder={t('workspace.subjectPlaceholder', 'Toán, Ngữ văn...')}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {t('workspace.gradeLevel', 'Khối lớp')}
                    </label>
                    <input
                      type="text"
                      value={formGradeLevel}
                      onChange={(e) => setFormGradeLevel(e.target.value)}
                      placeholder={t('workspace.gradePlaceholder', 'Lớp 10, Lớp 11...')}
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t('workspace.description', 'Mô tả')}
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t('workspace.descriptionPlaceholder', 'Ghi chú về học phần hoặc lớp giảng dạy...')}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                  >
                    {t('common.cancel', 'Hủy')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="w-4 h-4 text-white" />
                        {t('common.saving', 'Đang lưu...')}
                      </span>
                    ) : editingWorkspace ? (
                      t('common.save', 'Lưu thay đổi')
                    ) : (
                      t('workspace.create', 'Tạo không gian')
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title={t('workspace.deleteConfirmTitle', 'Xóa không gian làm việc?')}
        description={
          workspaceToDelete
            ? `Bạn có chắc chắn muốn xóa không gian "${workspaceToDelete.name}"? Mọi tài liệu và bài giảng bên trong sẽ bị xóa.`
            : t('workspace.deleteConfirm')
        }
        isLoading={isDeleting}
      />
    </div>
  );
}

export default WorkspaceListPage;
