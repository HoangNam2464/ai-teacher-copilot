import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../core/components/ui/Button';
import { validateEmail } from '../../../core/utils/validators';
import { PATHS } from '../../../app/routes/paths';

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validate full name
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên giáo viên.');
      return;
    }

    // 2. Validate email format
    if (!validateEmail(email)) {
      setError('Email không đúng định dạng. Ví dụ: teacher@school.edu.vn');
      return;
    }

    // 3. Validate password rules
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    // 4. Validate password confirmation
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.register(email, password, fullName);
      setAuth(data.token, { email: data.email, fullName: data.fullName, role: data.role });
      navigate(PATHS.DASHBOARD);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || err.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--color-danger-light, #fee2e2)',
            color: 'var(--color-danger-text, #991b1b)',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '0.875rem',
            border: '1px solid #fecaca',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
          Họ và tên giáo viên
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Thầy / Cô Nguyễn Văn A"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
          Email giáo viên
        </label>
        <input
          type="email"
          className="form-input"
          placeholder="teacher@school.edu.vn"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
          Mật khẩu (tối thiểu 6 ký tự)
        </label>
        <input
          type="password"
          className="form-input"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '1.25rem' }}>
        <label className="form-label" style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 500 }}>
          Xác nhận mật khẩu
        </label>
        <input
          type="password"
          className="form-input"
          placeholder="••••••••"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
        Tạo tài khoản giáo viên
      </Button>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary, #64748b)' }}>
        Đã có tài khoản?{' '}
        <Link to={PATHS.LOGIN} style={{ fontWeight: 600, color: 'var(--color-primary, #16a34a)' }}>
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
