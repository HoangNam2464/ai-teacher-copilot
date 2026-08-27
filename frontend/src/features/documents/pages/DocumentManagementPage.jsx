import React, { useState, useEffect } from 'react';
import { documentApi } from '../services/documentApi';
import { DocumentUploader } from '../components/DocumentUploader';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Badge } from '../../../core/components/ui/Badge';
import { Spinner } from '../../../core/components/ui/Spinner';
import { formatFileSize, formatDate } from '../../../core/utils/formatters';

export function DocumentManagementPage() {
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này? Các vector chunks liên quan sẽ bị xóa khỏi RAG.')) {
      return;
    }
    try {
      await documentApi.deleteDocument(activeWorkspace.id, docId);
      await loadDocuments();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Xóa tài liệu thất bại.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
        return <Badge variant="success">Sẵn sàng (RAG Active)</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">Đang xử lý vector...</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Lỗi xử lý</Badge>;
      default:
        return <Badge variant="neutral">{status || 'PENDING'}</Badge>;
    }
  };

  if (!activeWorkspace) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Vui lòng chọn một Không gian làm việc trước để quản lý tài liệu.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tài Liệu & Kho Tri Thức Học Liệu</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
          Quản lý tài liệu nguồn phục vụ truy xuất RAG cho không gian <strong>{activeWorkspace.name}</strong>
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <DocumentUploader onUploadSuccess={handleUploadSuccess} disabled={!activeWorkspace} />
      </div>

      <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Danh Sách Tài Liệu Đã Nạp ({documents.length})</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadDocuments}>
            🔄 Làm mới
          </button>
        </div>

        {loading ? (
          <Spinner message="Đang tải danh sách tài liệu..." />
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '2.5rem' }}>📚</span>
            <p style={{ marginTop: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Chưa có tài liệu nào trong không gian này. Hãy tải lên file đầu tiên ở trên.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Tên file</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Dung lượng</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Trạng thái RAG</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>Thời gian tải</th>
                <th style={{ padding: '0.75rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1.25rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    📄 {doc.fileName}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem' }}>
                    {getStatusBadge(doc.status || doc.processingStatus)}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', color: 'var(--color-text-secondary)' }}>
                    {formatDate(doc.uploadedAt || doc.createdAt)}
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{ color: 'var(--color-danger)', fontSize: '0.8125rem', cursor: 'pointer' }}
                      onClick={() => handleDelete(doc.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
