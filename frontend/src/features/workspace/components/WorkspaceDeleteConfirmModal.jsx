import React from 'react';
import { Modal } from '../../../core/components/ui/Modal';
import { Button } from '../../../core/components/ui/Button';
import { IconAlertTriangle, IconTrash } from '../../../core/components/icons/SvgIcons';

export function WorkspaceDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  workspace,
  loading = false,
}) {
  if (!workspace) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title="Xác Nhận Xóa Không Gian Làm Việc"
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
            icon={<IconTrash size={16} />}
          >
            {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-danger-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-danger-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2-5)',
            color: 'var(--color-danger-text)',
            fontSize: 'var(--font-size-xs)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          <IconAlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Lưu ý về ngưng kích hoạt (Soft Delete):</strong>
            <p style={{ margin: '4px 0 0 0' }}>
              Không gian làm việc <strong>{workspace.name}</strong> sẽ được chuyển sang trạng thái ngưng hoạt động. Mọi tài liệu và bài giảng liên quan sẽ không còn xuất hiện trong các luồng truy xuất RAG và soạn bài.
            </p>
          </div>
        </div>

        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Thầy/Cô có chắc chắn muốn xóa không gian làm việc này không?
        </p>
      </div>
    </Modal>
  );
}
