import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { documentApi } from '@/services/documents';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { useWorkspace } from '@/hooks/useWorkspace';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshCw, File as FileIcon, Trash2, LibraryBig } from 'lucide-react';
import { formatFileSize, formatDate } from '@/utils/formatters';

export function DocumentManagementPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDocuments = async () => {
    if (!activeWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await documentApi.getDocuments(activeWorkspace.id);
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeWorkspace?.id]);

  const handleUploadSuccess = async (file) => {
    if (!activeWorkspace?.id) return;
    await documentApi.uploadDocument(activeWorkspace.id, file, {
      subject: activeWorkspace.subject,
      gradeLevel: activeWorkspace.gradeLevel,
    });
    await loadDocuments();
  };

  const handleDelete = async (docId) => {
    if (!window.confirm(t('documents.deleteConfirm'))) {
      return;
    }
    try {
      await documentApi.deleteDocument(activeWorkspace.id, docId);
      await loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(t('documents.deleteFailed'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
        return <Badge variant="success">{t('documents.statusReady')}</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">{t('documents.statusProcessing')}</Badge>;
      case 'FAILED':
        return <Badge variant="danger">{t('documents.statusFailed')}</Badge>;
      default:
        return <Badge variant="neutral">{status || 'PENDING'}</Badge>;
    }
  };

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LibraryBig className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('workspace.noActiveContext')}</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t('documents.selectWorkspaceFirst')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('documents.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('documents.subtitle')} <strong className="text-foreground">{activeWorkspace.name}</strong>
        </p>
      </div>

      <div className="mb-6">
        <DocumentUploader onUploadSuccess={handleUploadSuccess} disabled={!activeWorkspace} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {t('documents.listTitle')} ({documents.length})
            </CardTitle>
            <CardDescription>{t('documents.listSubtitle')}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadDocuments} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="py-12">
              <Spinner message={t('documents.loadingDocs')} />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">{t('documents.empty')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {t('documents.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('documents.table.fileName')}</th>
                    <th className="px-4 py-3 font-semibold">{t('documents.table.fileSize')}</th>
                    <th className="px-4 py-3 font-semibold">{t('documents.table.status')}</th>
                    <th className="px-4 py-3 font-semibold">{t('documents.table.uploadedAt')}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t('documents.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-emerald-500" />
                        <span className="truncate max-w-[250px]" title={doc.fileName}>{doc.fileName}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(doc.status || doc.processingStatus)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(doc.uploadedAt || doc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(doc.id)}
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
    </div>
  );
}
