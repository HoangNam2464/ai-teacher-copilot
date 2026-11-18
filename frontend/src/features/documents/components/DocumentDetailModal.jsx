import React from 'react';
import { Modal } from '../../../core/components/ui/Modal';
import { Button } from '../../../core/components/ui/Button';
import { Badge } from '../../../core/components/ui/Badge';
import { formatFileSize, formatDate } from '../../../core/utils/formatters';
import {
  IconFileText,
  IconCheckCircle,
  IconClock,
  IconRefresh,
  IconAlertCircle,
  IconInfo,
} from '../../../core/components/icons/SvgIcons';

function getStatusInfo(status) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'READY':
      return {
        variant: 'success',
        icon: <IconCheckCircle size={14} />,
        label: 'Sẵn sàng (RAG Active)',
        desc: 'Tài liệu đã được bóc tách và tạo vector embeddings thành công. AI có thể trích dẫn làm căn cứ tri thức khi soạn giáo án và tạo câu hỏi.',
      };
    case 'PROCESSING':
      return {
        variant: 'warning',
        icon: <IconRefresh size={14} />,
        label: 'Đang xử lý vector...',
        desc: 'AI Service đang đọc cấu trúc, chia nhỏ thành các đoạn (chunks) và sinh vector embeddings lưu vào pgvector.',
      };
    case 'FAILED':
      return {
        variant: 'danger',
        icon: <IconAlertCircle size={14} />,
        label: 'Lỗi bóc tách',
        desc: 'Không thể xử lý nội dung tài liệu. Vui lòng kiểm tra lại định dạng file hoặc tải lên lại.',
      };
    case 'PENDING':
    default:
      return {
        variant: 'neutral',
        icon: <IconClock size={14} />,
        label: 'Chờ xử lý (Pending)',
        desc: 'Tài liệu đã được lưu trữ an toàn trên MinIO và đang chờ pipeline AI xử lý.',
      };
  }
}

export function DocumentDetailModal({ isOpen, onClose, document: doc }) {
  if (!doc) return null;

  const statusInfo = getStatusInfo(doc.processingStatus || doc.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi Tiết Tài Liệu Học Liệu"
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* File Header Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconFileText size={22} />
          </span>

          <div style={{ overflow: 'hidden', flex: 1 }}>
            <h4
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                margin: 0,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {doc.fileName}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px', fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-mono)' }}>
              <span>{formatFileSize(doc.fileSize)}</span>
              <span>•</span>
              <span>{doc.fileType || 'Tài liệu'}</span>
            </div>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Trạng thái RAG:</span>
            <Badge variant={statusInfo.variant} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </Badge>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Số lượng Vector Chunks:</span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              {typeof doc.chunkCount === 'number' ? `${doc.chunkCount} đoạn` : 'Đang xử lý'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Môn học / Lớp:</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {doc.subject || 'Toàn bộ'} • {doc.gradeLevel || 'Chung'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Thời gian tải lên:</span>
            <span style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-text-primary)' }}>
              {formatDate(doc.createdAt || doc.uploadedAt)}
            </span>
          </div>
        </div>

        {/* Status Explanation Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2-5)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--color-primary)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          <span style={{ color: 'var(--color-primary)', marginTop: '1px', display: 'flex' }}>
            <IconInfo size={16} />
          </span>
          <div>
            <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '2px' }}>
              Ý nghĩa trạng thái trong kho tri thức RAG:
            </strong>
            <span>{statusInfo.desc}</span>
          </div>
        </div>

        {/* Technical ID snippet */}
        <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-mono)' }}>
          Mã định danh (ID): {doc.id}
        </div>
      </div>
    </Modal>
  );
}
