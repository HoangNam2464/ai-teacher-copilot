import React from 'react';
import { IconSparkles, IconInfo } from '../icons/SvgIcons';
import { Badge } from '../ui/Badge';

export function DraftDisclaimerBanner({
  status = 'DRAFT',
  version = 1,
  className = '',
}) {
  const isDraft = status === 'DRAFT';
  const isApproved = status === 'APPROVED';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-2-5) var(--space-4)',
        backgroundColor: isApproved ? 'var(--color-success-light)' : 'var(--color-primary-light)',
        border: `1px solid ${isApproved ? 'var(--color-success-border)' : 'var(--color-primary-border)'}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
        gap: 'var(--space-3)',
      }}
      className={className}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
        <span style={{ color: isApproved ? 'var(--color-success)' : 'var(--color-primary)', display: 'flex' }}>
          {isApproved ? <IconInfo size={18} /> : <IconSparkles size={18} />}
        </span>
        <div style={{ fontSize: 'var(--font-size-xs)', color: isApproved ? 'var(--color-success-text)' : 'var(--color-text-primary)' }}>
          <strong>{isApproved ? 'Tài liệu đã được duyệt' : 'Bản thảo đề xuất bởi AI (Draft)'}</strong>
          <span style={{ color: 'var(--color-text-secondary)', marginLeft: 'var(--space-2)' }}>
            {isApproved
              ? 'Tài liệu đã sẵn sàng để xuất bản hoặc giảng dạy trên lớp.'
              : 'Thầy/Cô có toàn quyền biên tập, chỉnh sửa trực tiếp hoặc sinh lại nội dung.'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Badge variant="neutral">v{version}</Badge>
        <Badge variant={isApproved ? 'success' : 'primary'}>
          {isApproved ? 'Đã duyệt' : 'Bản nháp'}
        </Badge>
      </div>
    </div>
  );
}
