import React from 'react';

/**
 * Input — Reusable form input component.
 *
 * @param {string}   id          - Required. Unique ID for the input (links label).
 * @param {string}   label       - Label text displayed above the input.
 * @param {string}   type        - HTML input type. Default: 'text'.
 * @param {string}   placeholder - Placeholder text.
 * @param {string}   value       - Controlled value.
 * @param {function} onChange    - onChange handler.
 * @param {string}   error       - Error message shown below input (red state).
 * @param {string}   hint        - Helper text shown below input (grey, no error).
 * @param {boolean}  disabled    - Disables the input. Default: false.
 * @param {boolean}  required    - Marks field as required. Default: false.
 * @param {string}   className   - Additional class names.
 */
export function Input({
  id,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  hint = '',
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="form-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={`form-input ${error ? 'form-input--error' : ''}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className="form-hint">
          {hint}
        </span>
      )}
    </div>
  );
}

/**
 * Textarea — Reusable multiline text area component.
 *
 * @param {string}   id          - Required. Unique ID for the textarea.
 * @param {string}   label       - Label text displayed above the textarea.
 * @param {string}   placeholder - Placeholder text.
 * @param {string}   value       - Controlled value.
 * @param {function} onChange    - onChange handler.
 * @param {number}   rows        - Number of visible rows. Default: 4.
 * @param {string}   error       - Error message shown below textarea.
 * @param {string}   hint        - Helper text shown below textarea.
 * @param {boolean}  disabled    - Disables the textarea. Default: false.
 * @param {boolean}  required    - Marks field as required. Default: false.
 * @param {string}   className   - Additional class names.
 */
export function Textarea({
  id,
  label,
  placeholder = '',
  value,
  onChange,
  rows = 4,
  error = '',
  hint = '',
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="form-required" aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={error ? 'true' : undefined}
        className={`form-textarea ${error ? 'form-input--error' : ''}`}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${id}-hint`} className="form-hint">
          {hint}
        </span>
      )}
    </div>
  );
}
