import React from 'react';
import { SpinnerIcon } from './Icons';

/**
 * Button — Standardized Button component following shadcn/ui + Radix principles.
 *
 * @param {string}          variant   - 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'.
 * @param {string}          size      - 'sm' | 'default' | 'lg' | 'icon'.
 * @param {boolean}         loading   - Activates spinner and disables pointer events.
 * @param {string}          loadingText - Optional replacement text when loading.
 * @param {boolean}         disabled  - Disabled state.
 * @param {React.ReactNode} leftIcon  - Optional leading icon.
 * @param {React.ReactNode} rightIcon - Optional trailing icon.
 */
export function Button({
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  loadingText = '',
  leftIcon = null,
  rightIcon = null,
  className = '',
  type = 'button',
  ...props
}) {
  const normalizedVariant = variant === 'primary' ? 'default' : variant;
  const variantClass = `btn-${normalizedVariant}`;
  const sizeClass = size === 'default' ? 'btn-default' : `btn-${size}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      {...props}
    >
      {loading ? (
        <SpinnerIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="btn-spinner" />
      ) : leftIcon ? (
        <span className="btn-icon-left" aria-hidden="true">
          {leftIcon}
        </span>
      ) : null}

      <span className="btn-text">{loading && loadingText ? loadingText : children}</span>

      {!loading && rightIcon ? (
        <span className="btn-icon-right" aria-hidden="true">
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
}
