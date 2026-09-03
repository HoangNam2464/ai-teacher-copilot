import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/services/auth/authApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/Alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { validateEmail } from '@/utils/validators';
import { PATHS } from '@/routes/paths';

export function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
      if (!value.trim()) error = 'Vui lòng nhập email.';
      else if (!validateEmail(value.trim())) error = 'Email không hợp lệ.';
    } else if (name === 'password') {
      if (!value) error = 'Vui lòng nhập mật khẩu.';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
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
      const firstErrorField = newErrors.email ? 'email' : 'password';
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setLoading(true);
    try {
      const responseData = await authApi.login(formData.email.trim(), formData.password);
      if (responseData?.token) {
        setAuth(responseData.token, {
          email: responseData.email || formData.email.trim(),
          fullName: responseData.fullName || '',
          role: responseData.role || 'TEACHER',
        });
      }
      navigate(PATHS.WORKSPACES);
    } catch (err) {
      console.error('Login error:', err);
      setApiError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Email hoặc mật khẩu không chính xác.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && <Alert variant="destructive">{apiError}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="email@truong.edu.vn"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          autoComplete="email"
          required
        />
        {touched.email && errors.email && (
          <p className="text-[13px] text-destructive font-medium">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
            Quên mật khẩu?
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            autoComplete="current-password"
            className="pr-10"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {touched.password && errors.password && (
          <p className="text-[13px] text-destructive font-medium">{errors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Đăng nhập
      </Button>

      <div className="text-center text-sm text-muted-foreground mt-4">
        Chưa có tài khoản?{' '}
        <Link to={PATHS.REGISTER} className="font-medium text-emerald-600 hover:text-emerald-500">
          Đăng ký miễn phí
        </Link>
      </div>
    </form>
  );
}
