import React, { useState, useEffect, useMemo } from 'react';
import { documentApi } from '../services/documentApi';
import { DocumentUploadZone } from '../components/DocumentUploadZone';
import { DocumentRow } from '../components/DocumentRow';
import { DocumentDetailModal } from '../components/DocumentDetailModal';
import { useWorkspace } from '../../../core/hooks/useWorkspace';
import { Badge } from '../../../core/components/ui/Badge';
import { Button } from '../../../core/components/ui/Button';
import { Spinner } from '../../../core/components/ui/Spinner';
import { EmptyState } from '../../../core/components/feedback/EmptyState';
import {
  IconSchool,
  IconBookOpen,
  IconSearch,
  IconRefresh,
  IconCheckCircle,
  IconClock,
  IconAlertCircle,
} from '../../../core/components/icons/SvgIcons';

export function DocumentManagementPage() {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDocForDetail, setSelectedDocForDetail] = useState(null);

  const loadDocuments = async (isManualRefresh = false) => {
    if (!activeWorkspace?.id) return;
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await documentApi.getDocuments(activeWorkspace.id);
      setDocuments(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    await loadDocuments(true);
  };

  // Client-side filtering & search
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = !searchQuery.trim() ||
        (doc.fileName || '').toLowerCase().includes(searchQuery.trim().toLowerCase());

      const status = (doc.processingStatus || doc.status || 'PENDING').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [documents, searchQuery, statusFilter]);

  // Document status summary metrics
  const metrics = useMemo(() => {
    let readyCount = 0;
    let processingCount = 0;
    let totalChunks = 0;

    documents.forEach((doc) => {
      const s = (doc.processingStatus || doc.status || '').toUpperCase();
      if (s === 'READY') readyCount++;
      if (s === 'PROCESSING' || s === 'PENDING') processingCount++;
      if (typeof doc.chunkCount === 'number') totalChunks += doc.chunkCount;
    });

    return {
      total: documents.length,
      ready: readyCount,
      processing: processingCount,
      chunks: totalChunks,
    };
  }, [documents]);

  if (!activeWorkspace) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-4)' }}>
        <EmptyState
          icon={IconSchool}
          title="Chưa Chọn Không Gian Làm Việc"
          description="Vui lòng chọn hoặc tạo một Không gian làm việc từ menu để quản lý tài liệu học liệu."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Tài Liệu & Kho Tri Thức Học Liệu
          </h1>
          <Badge variant="primary">RAG Knowledge Base</Badge>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Quản lý tài liệu nguồn phục vụ truy xuất RAG vector cho không gian làm việc <strong>{activeWorkspace.name}</strong>.
        </p>
      </div>

      {/* 2. Workspace Context & Status Metrics Ribbon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
            <IconSchool size={20} />
          </span>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Không gian làm việc
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {activeWorkspace.name} ({activeWorkspace.subject || 'Chung'})
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <span style={{ color: 'var(--color-success)', display: 'flex' }}>
            <IconCheckCircle size={20} />
          </span>
          <div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Học liệu sẵn sàng RAG
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-primary)' }}>
              {metrics.ready} / {metrics.total} tài liệu ({metrics.chunks} chunks)
            </div>
          </div>
        </div>

        {metrics.processing > 0 && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-warning-light)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <span style={{ color: 'var(--color-warning-text)', display: 'flex' }}>
              <IconClock size={20} />
            </span>
            <div>
              <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-warning-text)', fontWeight: 'var(--font-weight-medium)' }}>
                Đang trong pipeline xử lý
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning-text)' }}>
                {metrics.processing} tài liệu đang bóc tách
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Drag & Drop Upload Zone */}
      <DocumentUploadZone onUpload={handleUploadSuccess} disabled={loading} />

      {/* 4. Document Table Card Container */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Document Toolbar: Search, Filter & Refresh */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', margin: 0 }}>
              Danh Sách Học Liệu Đã Nạp
            </h3>
            <Badge variant="neutral">
              {filteredDocuments.length} tài liệu
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
                <IconSearch size={14} />
              </span>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '30px', paddingRight: '12px', fontSize: 'var(--font-size-xs)', height: '32px' }}
                placeholder="Tìm tên tài liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="form-select"
              style={{ padding: '0 var(--space-2-5)', fontSize: 'var(--font-size-xs)', height: '32px', width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="READY">Sẵn sàng (RAG Active)</option>
              <option value="PROCESSING">Đang xử lý</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="FAILED">Lỗi bóc tách</option>
            </select>

            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadDocuments(true)}
              loading={refreshing}
              disabled={refreshing || loading}
              icon={<IconRefresh size={14} />}
              title="Làm mới trạng thái danh sách tài liệu"
            >
              <span>Làm mới</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ padding: 'var(--space-10)', display: 'flex', justifyContent: 'center' }}>
            <Spinner message="Đang tải danh sách tài liệu học liệu..." size="md" />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: 'var(--space-10) var(--space-4)' }}>
            <EmptyState
              icon={IconBookOpen}
              title="Kho Tri Thức Học Liệu Chưa Có Tài Liệu"
              description="Thêm sách giáo khoa, giáo trình hoặc tài liệu được phê duyệt để AI có thể sử dụng làm nguồn kiến thức trong các quy trình tạo nội dung."
            />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div style={{ padding: 'var(--space-8) var(--space-4)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0 }}>
              Không tìm thấy tài liệu nào khớp với từ khóa "{searchQuery}" hoặc bộ lọc đã chọn.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tên tài liệu
                  </th>
                  <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Dung lượng
                  </th>
                  <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Vector Chunks
                  </th>
                  <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Trạng thái RAG
                  </th>
                  <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ngày tải lên
                  </th>
                  <th style={{ padding: 'var(--space-2-5) var(--space-4)', fontSize: 'var(--font-size-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onViewDetail={(item) => setSelectedDocForDetail(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Document Metadata Detail Modal */}
      <DocumentDetailModal
        isOpen={Boolean(selectedDocForDetail)}
        onClose={() => setSelectedDocForDetail(null)}
        document={selectedDocForDetail}
      />
    </div>
  );
}
