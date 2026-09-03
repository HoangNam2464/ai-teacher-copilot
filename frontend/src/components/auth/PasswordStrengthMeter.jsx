import React from 'react';
import { CheckIcon, CheckCircle2Icon } from '@/components/ui/Icons';

/**
 * PasswordStrengthMeter — Live password complexity evaluator & visual indicator.
 *
 * @param {string} password - Current password string.
 */
export function PasswordStrengthMeter({ password = '' }) {
  if (!password) {
    return null;
  }

  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteria = [
    { label: 'Tối thiểu 8 ký tự', passed: hasLength },
    { label: 'Chữ hoa và chữ thường', passed: hasLower && hasUpper },
    { label: 'Ít nhất một chữ số (0-9)', passed: hasNumber },
    { label: 'Ký tự đặc biệt (@, #, $...)', passed: hasSpecial },
  ];

  const passedCount = criteria.filter((c) => c.passed).length;

  let strengthLabel = 'Rất yếu';
  let strengthClass = 'weak';

  if (passedCount === 2) {
    strengthLabel = 'Trung bình';
    strengthClass = 'fair';
  } else if (passedCount === 3) {
    strengthLabel = 'Khá';
    strengthClass = 'good';
  } else if (passedCount === 4) {
    strengthLabel = 'Mạnh & An toàn';
    strengthClass = 'strong';
  }

  return (
    <div className="password-meter-box" aria-live="polite">
      <div className="password-meter-header">
        <span className="password-meter-label">Độ an toàn mật khẩu:</span>
        <span className={`password-meter-status ${strengthClass}`}>{strengthLabel}</span>
      </div>

      <div className="password-meter-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`password-meter-bar ${
              index <= passedCount ? `active-${strengthClass}` : ''
            }`}
          />
        ))}
      </div>

      <ul className="password-checklist" aria-label="Tiêu chí độ mạnh mật khẩu">
        {criteria.map((item, i) => (
          <li
            key={i}
            className={`password-checklist-item ${item.passed ? 'passed' : ''}`}
          >
            <span className="password-checklist-icon" aria-hidden="true">
              {item.passed ? (
                <CheckCircle2Icon size={13} style={{ color: 'var(--color-success)' }} />
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    border: '1.5px solid var(--color-text-muted)',
                  }}
                />
              )}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
