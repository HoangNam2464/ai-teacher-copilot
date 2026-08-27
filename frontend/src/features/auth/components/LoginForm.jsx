import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../core/components/ui/Button';
import { Input } from '../../../core/components/ui/Input';
import { Alert } from '../../../core/components/ui/Alert';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '../../../core/components/ui/Icons';
import { validateEmail } from '../../../core/utils/validators';
import { PATHS } from '../../../app/routes/paths';

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) {
        error = 'Vui lòng nhập địa chỉ email.';
      } else if (!validateEmail(value.trim())) {
        error = 'Email không đúng định dạng.';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Vui lòng nhập mật khẩu.';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };

    setTouched({ email: true, password: true });
    setErrors(newErrors);

    if (newErrors.email || newErrors.password) {
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login(formData.email.trim(), formData.password);
      setAuth(data.token, { email: data.email, fullName: data.fullName, role: data.role });
      navigate(PATHS.WORKSPACES);
    } catch (err) {
      console.error('Login error:', err);
      setApiError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Form đăng nhập giáo viên">
      {/* Alert Error Component */}
      {apiError && <Alert variant="destructive">{apiError}</Alert>}

      {/* Email Input */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email giáo viên"
        placeholder="teacher@school.edu.vn"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email : ''}
        required
        disabled={loading}
        autoComplete="email"
        leftIcon={<MailIcon size={18} />}
      />

      {/* Password Input with "Quên mật khẩu?" on the same row */}
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Mật khẩu"
        labelRight={
          <a
            href="#forgot-password"
            className="form-label-link"
            onClick={(e) => {
              e.preventDefault();
              alert('Vui lòng liên hệ Quản trị viên nhà trường để cấp lại mật khẩu.');
            }}
          >
            Quên mật khẩu?
          </a>
        }
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password : ''}
        required
        disabled={loading}
        autoComplete="current-password"
        leftIcon={<LockIcon size={18} />}
        rightAction={
          <button
            type="button"
            className="form-input-action-right"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            tabIndex={0}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        }
      />

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        loading={loading}
        loadingText="Đang xác thực thông tin..."
        style={{ width: '100%', marginTop: 'var(--space-2)' }}
        rightIcon={!loading && <ArrowRightIcon size={18} />}
      >
        Đăng nhập vào hệ thống
      </Button>

      {/* Security note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          marginTop: 'var(--space-4)',
          fontSize: 'var(--font-size-xs)',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        <ShieldCheckIcon size={15} style={{ color: 'hsl(var(--primary))' }} />
        <span>Hệ thống bảo mật dữ liệu sư phạm K-12</span>
      </div>

      {/* Switch to Register */}
      <div
        style={{
          textAlign: 'center',
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid hsl(var(--border))',
          fontSize: 'var(--font-size-sm)',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        Chưa có tài khoản giáo viên?{' '}
        <Link
          to={PATHS.REGISTER}
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(var(--primary))',
            textDecoration: 'none',
          }}
        >
          Đăng ký tài khoản mới
        </Link>
      </div>
    </form>
  );
}
