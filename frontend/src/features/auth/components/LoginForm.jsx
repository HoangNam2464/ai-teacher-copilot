import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuth } from '../../../core/hooks/useAuth';
import { Button } from '../../../core/components/ui/Button';
import { Alert } from '../../../core/components/ui/Alert';
import {
  GoogleIcon,
  GithubIcon,
  EyeIcon,
  EyeOffIcon,
} from '../../../core/components/ui/Icons';
import { validateEmail } from '../../../core/utils/validators';
import { PATHS } from '../../../app/routes/paths';

/**
 * Teacher Login Form Component.
 * Implements email/password authentication via authApi, validates input, 
 * handles loading/error states, and persists JWT token to authStore upon success.
 * Redirects the user to the Workspaces dashboard when login succeeds.
 */
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
        error = 'Please enter your email address.';
      } else if (!validateEmail(value.trim())) {
        error = 'Please enter a valid email address.';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Please enter your password.';
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
      const firstErrorField = newErrors.email ? 'email' : 'password';
      const el = document.getElementById(firstErrorField);
      if (el) el.focus();
      return;
    }

    setLoading(true);

    try {
      const responseData = await authApi.login(formData.email.trim(), formData.password);

      if (responseData && responseData.token) {
        setAuth(responseData.token, {
          email: responseData.email || formData.email.trim(),
          fullName: responseData.fullName || '',
          role: responseData.role || 'TEACHER',
        });
      }

      navigate(PATHS.WORKSPACES);
    } catch (err) {
      console.error('Login error:', err);
      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Invalid email or password. Please try again.';
      setApiError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Login form">
      {/* Social Login Row */}
      <div className="social-auth-row">
        <button
          type="button"
          className="social-auth-btn"
          title="Sign in with Google"
          aria-label="Sign in with Google"
          onClick={() => alert('Google Sign-In integration available in production.')}
        >
          <GoogleIcon size={20} />
        </button>
        <button
          type="button"
          className="social-auth-btn github-btn"
          title="Sign in with GitHub"
          aria-label="Sign in with GitHub"
          onClick={() => alert('GitHub Sign-In integration available in production.')}
        >
          <GithubIcon size={20} />
        </button>
      </div>

      {/* Divider */}
      <div className="auth-divider">
        <span>OR SIGN IN WITH EMAIL</span>
      </div>

      {/* API Error Alert */}
      {apiError && <Alert variant="destructive">{apiError}</Alert>}

      {/* Email */}
      <div className="form-group auth-form-group">
        <label className="form-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          className={`form-input ${touched.email && errors.email ? 'form-input--error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading}
          autoComplete="email"
          required
        />
        {touched.email && errors.email && (
          <span className="form-error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      {/* Password */}
      <div className="form-group auth-form-group">
        <div className="form-label-row">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>
          <Link
            to={PATHS.FORGOT_PASSWORD}
            className="form-label-link"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="form-input-wrapper">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            className={`form-input ${touched.password && errors.password ? 'form-input--error' : ''}`}
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            autoComplete="current-password"
            required
            style={{ paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            className="form-input-action-right"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
        {touched.password && errors.password && (
          <span className="form-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        loading={loading}
        loadingText="Signing in..."
        className="auth-submit-btn"
        style={{ marginTop: 'var(--space-4)' }}
      >
        Sign In
      </Button>

      {/* Switch to Register */}
      <div className="auth-footer-switch">
        Don&apos;t have an account?{' '}
        <Link to={PATHS.REGISTER} className="auth-footer-link">
          Sign up
        </Link>
      </div>
    </form>
  );
}
