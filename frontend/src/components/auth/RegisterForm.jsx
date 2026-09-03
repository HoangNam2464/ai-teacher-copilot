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

export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    agreedToTerms: false,
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Vui lòng nhập họ tên.';
        else if (value.trim().length < 2) error = 'Họ tên phải có ít nhất 2 ký tự.';
        break;
      case 'email':
        if (!value.trim()) error = 'Vui lòng nhập email.';
        else if (!validateEmail(value.trim())) error = 'Email không hợp lệ.';
        break;
      case 'password':
        if (!value) error = 'Vui lòng tạo mật khẩu.';
        else if (value.length < 8) error = 'Mật khẩu phải có ít nhất 8 ký tự.';
        else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) error = 'Phải có chữ hoa và chữ thường.';
        else if (!/[0-9]/.test(value)) error = 'Phải có ít nhất một chữ số.';
        break;
      case 'agreedToTerms':
        if (!value) error = 'Bạn phải đồng ý với Điều khoản sử dụng.';
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, fieldValue) }));
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, fieldValue) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');

    const allTouched = { fullName: true, email: true, password: true, agreedToTerms: true };
    setTouched(allTouched);

    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      agreedToTerms: validateField('agreedToTerms', formData.agreedToTerms),
    };
    setErrors(newErrors);

    const firstErrorField = Object.keys(newErrors).find((key) => Boolean(newErrors[key]));
    if (firstErrorField) {
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setLoading(true);
    try {
      const responseData = await authApi.register(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      );
      setSuccessMessage('Tạo tài khoản thành công! Đang chuyển hướng...');
      
      if (responseData?.token) {
        setAuth(responseData.token, {
          email: responseData.email || formData.email.trim(),
          fullName: responseData.fullName || formData.fullName.trim(),
          role: responseData.role || 'TEACHER',
        });
      }
      setTimeout(() => navigate(PATHS.WORKSPACES), 1000);
    } catch (err) {
      console.error('Registration error:', err);
      setApiError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Đăng ký thất bại. Email có thể đã tồn tại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && <Alert variant="destructive">{apiError}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="space-y-2">
        <Label htmlFor="fullName">Họ và Tên</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Nguyễn Văn A"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading || Boolean(successMessage)}
          autoComplete="name"
          required
        />
        {touched.fullName && errors.fullName && (
          <p className="text-[13px] text-destructive font-medium">{errors.fullName}</p>
        )}
      </div>

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
          disabled={loading || Boolean(successMessage)}
          autoComplete="email"
          required
        />
        {touched.email && errors.email && (
          <p className="text-[13px] text-destructive font-medium">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Tạo mật khẩu mạnh"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading || Boolean(successMessage)}
            autoComplete="new-password"
            className="pr-10"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading || Boolean(successMessage)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự gồm chữ hoa, chữ thường và số</p>
        {touched.password && errors.password && (
          <p className="text-[13px] text-destructive font-medium">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <input
          id="agreedToTerms"
          name="agreedToTerms"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
          checked={formData.agreedToTerms}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading || Boolean(successMessage)}
        />
        <Label htmlFor="agreedToTerms" className="text-sm font-normal text-muted-foreground cursor-pointer">
          Tôi đồng ý với <a href="#" className="text-emerald-600 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-emerald-600 hover:underline">Chính sách bảo mật</a>
        </Label>
      </div>
      {touched.agreedToTerms && errors.agreedToTerms && (
        <p className="text-[13px] text-destructive font-medium mt-1">{errors.agreedToTerms}</p>
      )}

      <Button type="submit" className="w-full mt-4" disabled={loading || Boolean(successMessage)}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Tạo tài khoản
      </Button>

      <div className="text-center text-sm text-muted-foreground mt-4">
        Đã có tài khoản?{' '}
        <Link to={PATHS.LOGIN} className="font-medium text-emerald-600 hover:text-emerald-500">
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
