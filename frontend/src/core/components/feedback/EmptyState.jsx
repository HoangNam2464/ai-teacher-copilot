import React from 'react';
import { IconBookOpen } from '../icons/SvgIcons';

export function EmptyState({
  icon: IconComponent = IconBookOpen,
  title = 'Chưa có dữ liệu',
  description = 'Chưa có thông tin nào được tạo trong mục này.',
  action = null,
  className = '',
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-6)',
        textAlign: 'center',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
      }}
      className={className}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          marginBottom: 'var(--space-4)',
        }}
      >
        {typeof IconComponent === 'function' ? (
          <IconComponent size={28} />
        ) : (
          IconComponent
        )}
      </div>

      <h4
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-1-5)',
        }}
      >
        {title}
      </h4>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          maxWidth: '440px',
          marginBottom: action ? 'var(--space-5)' : '0',
          lineHeight: 'var(--line-height-normal)',
        }}
      >
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  );
}
