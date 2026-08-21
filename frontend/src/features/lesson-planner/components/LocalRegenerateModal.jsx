import React, { useState } from 'react';
import { Modal } from '../../../core/components/ui/Modal';
import { Button } from '../../../core/components/ui/Button';
import { IconSparkles, IconRefresh } from '../../../core/components/icons/SvgIcons';

export function LocalRegenerateModal({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) {
  const [refinementPrompt, setRefinementPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!refinementPrompt.trim()) return;
    onSubmit(refinementPrompt.trim());
    setRefinementPrompt('');
  };

  const handleClose = () => {
    if (!loading) {
      setRefinementPrompt('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Yêu Cầu Tinh Chỉnh & Sinh Lại Bài Soạn"
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!refinementPrompt.trim() || loading}
            icon={<IconSparkles size={16} />}
          >
            Bắt đầu sinh lại
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 'var(--line-height-normal)' }}>
          Nhập các chỉ dẫn sư phạm bổ sung để AI điều chỉnh kế hoạch bài dạy. Bản giáo án mới sẽ được kiến tạo và nâng số phiên bản trong phiên làm việc hiện tại.
        </p>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: 'var(--font-size-xs)' }}>
            Chỉ dẫn tinh chỉnh sư phạm *
          </label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder="Ví dụ:&#10;- Bổ sung hoạt động trò chơi Khởi động 5 phút với Kahoot/Quizizz&#10;- Giảm bớt thời lượng phần lý thuyết, tăng thời gian làm bài tập nhóm&#10;- Thêm câu hỏi phân hóa cho học sinh khá giỏi..."
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        <div
          style={{
            padding: 'var(--space-2-5) var(--space-3)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-2xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <strong>Lưu ý về phiên làm việc:</strong> Thao tác này sẽ gửi lại yêu cầu cùng chỉ dẫn mới tới mô hình AI và tạo bản thảo kế tiếp (v2, v3...) trong phiên làm việc này.
        </div>
      </form>
    </Modal>
  );
}
