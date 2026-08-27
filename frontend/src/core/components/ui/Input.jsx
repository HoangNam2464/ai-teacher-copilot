import React from 'react';

/**
 * Input — Standard Form Input Component (shadcn/ui + Radix style).
 *
 * @param {string}          id          - Unique ID linking label & input.
 * @param {string}          label       - Label text above input.
 * @param {React.ReactNode} labelRight  - Optional element on the right of the label (e.g. "Quên mật khẩu?").
 * @param {string}          type        - HTML input type. Default: 'text'.
 * @param {string}          placeholder - Placeholder string.
 * @param {string}          value       - Controlled value.
 * @param {function}        onChange    - onChange handler.
 * @param {function}        onBlur      - onBlur handler for inline validation.
 * @param {string}          error       - Error message string (activates destructive state).
 * @param {string}          hint        - Helper hint text.
 * @param {boolean}         disabled    - Disabled state.
 * @param {boolean}         required    - Shows required indicator (*).
 * @param {React.ReactNode} leftIcon    - Optional leading icon.
 * @param {React.ReactNode} rightAction - Optional trailing action (e.g. eye toggle).
 * @param {string}          className   - Outer wrapper extra class.
 */
export function Input({
  id,
  label,
  labelRight = null,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error = '',
  hint = '',
  disabled = false,
  required = false,
  leftIcon = null,
  rightAction = null,
  className = '',
  autoComplete,
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = errorId || hintId || undefined;

  return (
    <div className={`form-group ${className}`}>
      {(label || labelRight) && (
        <div className="form-label-row">
          {label && (
            <label htmlFor={id} className="form-label">
              {label}
              {required && (
                <span className="form-required" aria-hidden="true">
                  {' '}*
                </span>
              )}
            </label>
          )}
          {labelRight && <div className="form-label-right">{labelRight}</div>}
        </div>
      )}

      <div className="form-input-container">
        {leftIcon && (
          <span className="form-input-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={`form-input ${leftIcon ? 'form-input--with-left-icon' : ''} ${
            rightAction ? 'form-input--with-right-action' : ''
          } ${error ? 'form-input--error' : ''}`}
          {...props}
        />

        {rightAction && (
          <div className="form-input-action-wrapper" style={{ display: 'contents' }}>
            {rightAction}
          </div>
        )}
      </div>

      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}

      {!error && hint && (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

/**
 * Textarea — Standard Multiline Text Input.
 */
export function Textarea({
  id,
  label,
  placeholder = '',
  value,
  onChange,
  onBlur,
  rows = 4,
  error = '',
  hint = '',
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = errorId || hintId || undefined;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && (
            <span className="form-required" aria-hidden="true">
              {' '}*
            </span>
          )}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`form-textarea ${error ? 'form-input--error' : ''}`}
        {...props}
      />
      {error && (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className="form-hint">
          {hint}
        </span>
      )}
    </div>
  );
}
