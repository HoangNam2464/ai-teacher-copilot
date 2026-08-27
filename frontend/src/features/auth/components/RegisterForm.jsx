import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../core/components/ui/Button';
import { Input } from '../../../core/components/ui/Input';
import { Alert } from '../../../core/components/ui/Alert';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '../../../core/components/ui/Icons';
import { validateEmail } from '../../../core/utils/validators';
import { PATHS } from '../../../app/routes/paths';

export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  // Validate a single field
  const validateField = (name, value, allValues = formData) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Vui lòng nhập họ và tên.';
        } else if (value.trim().length < 2) {
          error = 'Họ và tên phải có ít nhất 2 ký tự.';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Vui lòng nhập địa chỉ email.';
        } else if (!validateEmail(value.trim())) {
          error = 'Email không đúng định dạng. Ví dụ: teacher@school.edu.vn';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Vui lòng thiết lập mật khẩu.';
        } else if (value.length < 8) {
          error = 'Mật khẩu phải có ít nhất 8 ký tự.';
        } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
          error = 'Mật khẩu phải bao gồm cả chữ hoa và chữ thường.';
        } else if (!/[0-9]/.test(value)) {
          error = 'Mật khẩu phải chứa ít nhất một chữ số (0-9).';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Vui lòng xác nhận lại mật khẩu.';
        } else if (value !== allValues.password) {
          error = 'Mật khẩu xác nhận không khớp.';
        }
        break;

      case 'agreedToTerms':
        if (!value) {
          error = 'Bạn vui lòng xác nhận đồng ý điều khoản dịch vụ.';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const newFormData = {
      ...formData,
      [name]: fieldValue,
    };

    setFormData(newFormData);

    if (touched[name]) {
      const fieldError = validateField(name, fieldValue, newFormData);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));

      if (name === 'password' && touched.confirmPassword) {
        const confirmError = validateField('confirmPassword', formData.confirmPassword, newFormData);
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, fieldValue, formData);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    const allTouched = {
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreedToTerms: true,
    };
    setTouched(allTouched);

    const newErrors = {
      fullName: validateField('fullName', formData.fullName, formData),
      email: validateField('email', formData.email, formData),
      password: validateField('password', formData.password, formData),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData),
      agreedToTerms: validateField('agreedToTerms', formData.agreedToTerms, formData),
    };

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some((err) => Boolean(err));
    if (hasError) {
      const firstErrorField = Object.keys(newErrors).find((key) => Boolean(newErrors[key]));
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) el.focus();
      }
      return;
    }

    setLoading(true);

    try {
      const responseData = await authApi.register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      );

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng vào không gian làm việc...');

      if (responseData && responseData.token) {
        setAuth(responseData.token, {
          email: responseData.email || formData.email.trim(),
          fullName: responseData.fullName || formData.fullName.trim(),
          role: responseData.role || 'TEACHER',
        });
      }

      setTimeout(() => {
        navigate(PATHS.WORKSPACES);
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Đăng ký tài khoản thất bại. Email có thể đã được đăng ký trên hệ thống.';
      setApiError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Form đăng ký giáo viên">
      {/* Alert Error Component */}
      {apiError && <Alert variant="destructive">{apiError}</Alert>}

      {/* Alert Success Component */}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Full Name */}
      <Input
        id="fullName"
        name="fullName"
        type="text"
        label="Họ và tên giáo viên"
        placeholder="Thầy / Cô Nguyễn Văn A"
        value={formData.fullName}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.fullName ? errors.fullName : ''}
        required
        disabled={loading || Boolean(successMessage)}
        autoComplete="name"
        leftIcon={<UserIcon size={18} />}
      />

      {/* Email */}
      <Input
        id="email"
        name="email"
        type="email"
        label="Email công vụ / cá nhân"
        placeholder="teacher@school.edu.vn"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email ? errors.email : ''}
        hint="Dùng để đăng nhập và quản lý học liệu sư phạm."
        required
        disabled={loading || Boolean(successMessage)}
        autoComplete="email"
        leftIcon={<MailIcon size={18} />}
      />

      {/* Password */}
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Mật khẩu"
        placeholder="••••••••••••"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password ? errors.password : ''}
        required
        disabled={loading || Boolean(successMessage)}
        autoComplete="new-password"
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

      {/* Live Password Strength Meter */}
      <PasswordStrengthMeter password={formData.password} />

      {/* Confirm Password */}
      <Input
        id="confirmPassword"
        name="confirmPassword"
        type={showConfirmPassword ? 'text' : 'password'}
        label="Xác nhận lại mật khẩu"
        placeholder="••••••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.confirmPassword ? errors.confirmPassword : ''}
        required
        disabled={loading || Boolean(successMessage)}
        autoComplete="new-password"
        leftIcon={<LockIcon size={18} />}
        rightAction={
          <button
            type="button"
            className="form-input-action-right"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
            tabIndex={0}
          >
            {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        }
      />

      {/* Terms Checkbox */}
      <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
        <label className="terms-checkbox-label" htmlFor="agreedToTerms">
          <input
            id="agreedToTerms"
            name="agreedToTerms"
            type="checkbox"
            checked={formData.agreedToTerms}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading || Boolean(successMessage)}
            className="terms-checkbox"
            aria-describedby={errors.agreedToTerms ? 'terms-error' : undefined}
          />
          <span>
            Tôi đồng ý với{' '}
            <span className="terms-link">Điều khoản dịch vụ</span> &amp;{' '}
            <span className="terms-link">Chính sách bảo mật học liệu K-12</span>.
          </span>
        </label>
        {touched.agreedToTerms && errors.agreedToTerms && (
          <span id="terms-error" className="form-error" role="alert" style={{ marginTop: '0.25rem' }}>
            {errors.agreedToTerms}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        loading={loading}
        loadingText="Đang tạo tài khoản giáo viên..."
        disabled={Boolean(successMessage)}
        style={{ width: '100%' }}
        rightIcon={!loading && <ArrowRightIcon size={18} />}
      >
        Tạo tài khoản giáo viên ngay
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
        <span>Bảo mật dữ liệu sư phạm theo chuẩn GDPT 2018</span>
      </div>

      {/* Switch to Login */}
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
        Thầy/Cô đã có tài khoản?{' '}
        <Link
          to={PATHS.LOGIN}
          style={{
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(var(--primary))',
            textDecoration: 'none',
          }}
        >
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
