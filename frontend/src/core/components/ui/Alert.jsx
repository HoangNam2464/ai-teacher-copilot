import React from 'react';
import { AlertCircleIcon, CheckCircle2Icon } from './Icons';

/**
 * Alert — Standardized feedback alert component (shadcn/ui inspired).
 *
 * @param {string}          variant  - 'destructive' | 'success' | 'warning' | 'default'. Default: 'default'.
 * @param {string}          title    - Optional title.
 * @param {React.ReactNode} children - Alert description / content.
 * @param {string}          className- Extra class names.
 */
export function Alert({
  variant = 'default',
  title = '',
  children,
  className = '',
  ...props
}) {
  if (!children && !title) return null;

  const isDestructive = variant === 'destructive' || variant === 'error';
  const isSuccess = variant === 'success';

  return (
    <div
      role="alert"
      className={`alert alert-${variant} ${className}`}
      {...props}
    >
      <div className="alert-icon" aria-hidden="true">
        {isDestructive ? (
          <AlertCircleIcon size={18} />
        ) : isSuccess ? (
          <CheckCircle2Icon size={18} />
        ) : (
          <AlertCircleIcon size={18} />
        )}
      </div>

      <div className="alert-body">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-description">{children}</div>
      </div>
    </div>
  );
}
