import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { documentApi } from '@/services/documents';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { PATHS } from '@/routes/paths';
import {
  RefreshCw,
  FileText,
  Trash2,
  FolderOpen,
  Plus,
  Clock,
  HardDrive,
  FileCheck2,
} from 'lucide-react';
import { formatFileSize, formatDate } from '@/utils/formatters';

export function DocumentManagementPage() {
  const { t } = useTranslation();
  const { activeWorkspace, isInitialized, isLoading: isWorkspaceLoading } = useWorkspaceStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDocuments = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await documentApi.getDocuments(activeWorkspace.id);
      setDocuments(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [activeWorkspace?.id]);

  const handleUploadSuccess = async (file, onProgress) => {
    if (!activeWorkspace?.id) return;
    try {
      await documentApi.uploadDocument(
        activeWorkspace.id,
        file,
        {
          subject: activeWorkspace.subject,
          gradeLevel: activeWorkspace.gradeLevel,
        },
        onProgress
      );
      toast.success(t('documents.uploadSuccess', 'Tải lên tài liệu thành công! AI đang xử lý vector.'));
      await loadDocuments();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('documents.uploadFailed', 'Tải lên thất bại'));
      throw err;
    }
  };

  const handleOpenDelete = (doc) => {
    setDocToDelete(doc);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete?.id) return;
    try {
      setIsDeleting(true);
      await documentApi.deleteDocument(activeWorkspace.id, docToDelete.id);
      toast.success(t('common.success', 'Đã xóa tài liệu khỏi kho tri thức'));
      setDeleteModalOpen(false);
      setDocToDelete(null);
      await loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error(t('documents.deleteFailed', 'Xóa tài liệu thất bại'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
            <FileCheck2 className="w-3 h-3" />
            {t('documents.statusReady', 'Sẵn sàng (RAG Active)')}
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
            <Spinner className="w-3 h-3 text-amber-600" />
            {t('documents.statusProcessing', 'Đang xử lý vector...')}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
            {t('documents.statusFailed', 'Lỗi xử lý')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {status || 'PENDING'}
          </span>
        );
    }
  };

  // Loading initial workspace context
  if (isWorkspaceLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-green-600" />
      </div>
    );
  }

  // No active workspace
  if (!activeWorkspace) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4 text-green-600">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">
          {t('workspace.noActiveContext', 'Chưa chọn Không gian làm việc')}
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          {t('documents.selectWorkspaceFirst', 'Vui lòng chọn hoặc tạo một Không gian làm việc trước để quản lý tài liệu và kho tri thức.')}
        </p>
        <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
          <Link to={PATHS.WORKSPACES}>
            <Plus className="w-4 h-4 mr-2" />
            {t('workspace.createFirst', 'Quản lý Không gian làm việc')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('documents.title', 'Tài Liệu & Kho Tri Thức')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('documents.subtitle', 'Quản lý tài liệu nguồn phục vụ truy xuất RAG cho không gian:')}{' '}
            <strong className="text-foreground">{activeWorkspace.name}</strong>
          </p>
        </div>
      </div>

      {/* Uploader Section */}
      <DocumentUploader onUploadSuccess={handleUploadSuccess} disabled={!activeWorkspace} />

      {/* Documents List */}
      <Card className="rounded-xl border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-green-600" />
              <span>
                {t('documents.listTitle', 'Danh Sách Tài Liệu Đã Nạp')} ({documents.length})
              </span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('documents.listSubtitle', 'Các tài liệu này được AI phân tích và sử dụng để tạo giáo án và đề thi')}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDocuments}
            disabled={loading}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Làm mới')}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="w-7 h-7 text-green-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                {t('documents.empty', 'Chưa có tài liệu nào')}
              </h3>
              <p className="text-muted-foreground text-xs max-w-sm">
                {t('documents.emptyDesc', 'Chưa có tài liệu nào trong không gian này. Hãy tải lên file đầu tiên ở trên.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">{t('documents.table.fileName', 'Tên file')}</th>
                    <th className="px-4 py-3">{t('documents.table.fileSize', 'Dung lượng')}</th>
                    <th className="px-4 py-3">{t('documents.table.status', 'Trạng thái RAG')}</th>
                    <th className="px-4 py-3">{t('documents.table.uploadedAt', 'Thời gian tải')}</th>
                    <th className="px-5 py-3 text-right">{t('documents.table.actions', 'Thao tác')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="truncate max-w-xs md:max-w-md font-medium" title={doc.fileName}>
                            {doc.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(doc.status || doc.processingStatus)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs">
                        {formatDate(doc.uploadedAt || doc.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                          onClick={() => handleOpenDelete(doc)}
                          title={t('common.delete', 'Xóa tài liệu')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title={t('documents.deleteConfirmTitle', 'Xóa tài liệu khỏi kho tri thức?')}
        description={
          docToDelete
            ? `Bạn có chắc chắn muốn xóa tài liệu "${docToDelete.fileName}"? Mọi vector chunks đã tạo sẽ bị gỡ bỏ.`
            : t('documents.deleteConfirm')
        }
        isLoading={isDeleting}
      />
    </div>
  );
}

export default DocumentManagementPage;
