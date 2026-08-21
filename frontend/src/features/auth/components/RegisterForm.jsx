import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../core/components/ui/Button';
import { PATHS } from '../../../app/routes/paths';

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.register(email, password, fullName);
      setAuth(data.token, { email: data.email, fullName: data.fullName, role: data.role });
      navigate(PATHS.DASHBOARD);
    } catch (err) {
      console.error('Registration error:', err);
      const resData = err.response?.data;
      if (resData?.data && typeof resData.data === 'object') {
        const fieldErrors = Object.values(resData.data);
        setError(fieldErrors.join(', '));
      } else {
        setError(resData?.error || resData?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Họ và tên giáo viên</label>
        <input
          type="text"
          className="form-input"
          placeholder="Thầy / Cô Nguyễn Văn A"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email giáo viên</label>
        <input
          type="email"
          className="form-input"
          placeholder="teacher@school.edu.vn"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Mật khẩu (tối thiểu 8 ký tự)</label>
        <input
          type="password"
          className="form-input"
          placeholder="••••••••"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
        Tạo tài khoản giáo viên
      </Button>

      <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        Đã có tài khoản?{' '}
        <Link to={PATHS.LOGIN} style={{ fontWeight: 600 }}>
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
