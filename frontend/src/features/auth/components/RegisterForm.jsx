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

  const validateField = (name, value, allValues = formData) => {
    let error = '';

    switch (name) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Please enter your full name.';
        } else if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters.';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Please enter your email address.';
        } else if (!validateEmail(value.trim())) {
          error = 'Please enter a valid email address.';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Please create a password.';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters.';
        } else if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
          error = 'Password must contain uppercase and lowercase letters.';
        } else if (!/[0-9]/.test(value)) {
          error = 'Password must contain at least one number.';
        }
        break;

      case 'agreedToTerms':
        if (!value) {
          error = 'You must agree to the Terms of Service & Privacy Policy.';
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
      agreedToTerms: true,
    };
    setTouched(allTouched);

    const newErrors = {
      fullName: validateField('fullName', formData.fullName, formData),
      email: validateField('email', formData.email, formData),
      password: validateField('password', formData.password, formData),
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

      setSuccessMessage('Account created successfully! Redirecting...');

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
        'Registration failed. Email might already be registered.';
      setApiError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
      {/* Social Login Row */}
      <div className="social-auth-row">
        <button
          type="button"
          className="social-auth-btn"
          title="Sign up with Google"
          aria-label="Sign up with Google"
          onClick={() => alert('Google Sign-In integration available in production.')}
        >
          <GoogleIcon size={20} />
        </button>
        <button
          type="button"
          className="social-auth-btn github-btn"
          title="Sign up with GitHub"
          aria-label="Sign up with GitHub"
          onClick={() => alert('GitHub Sign-In integration available in production.')}
        >
          <GithubIcon size={20} />
        </button>
      </div>

      {/* Divider */}
      <div className="auth-divider">
        <span>OR SIGN UP WITH EMAIL</span>
      </div>

      {/* API Feedback Alerts */}
      {apiError && <Alert variant="destructive">{apiError}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {/* Full Name */}
      <div className="form-group auth-form-group">
        <label className="form-label" htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="John Doe"
          className={`form-input ${touched.fullName && errors.fullName ? 'form-input--error' : ''}`}
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading || Boolean(successMessage)}
          autoComplete="name"
          required
        />
        {touched.fullName && errors.fullName && (
          <span className="form-error" role="alert">
            {errors.fullName}
          </span>
        )}
      </div>

      {/* Email */}
      <div className="form-group auth-form-group">
        <label className="form-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          className={`form-input ${touched.email && errors.email ? 'form-input--error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading || Boolean(successMessage)}
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
        <label className="form-label" htmlFor="password">
          Password
        </label>
        <div className="form-input-wrapper">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            className={`form-input ${touched.password && errors.password ? 'form-input--error' : ''}`}
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading || Boolean(successMessage)}
            autoComplete="new-password"
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
        <div className="password-helper-text">
          Must be at least 8 characters with uppercase, lowercase, and number
        </div>
        {touched.password && errors.password && (
          <span className="form-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      {/* Terms & Privacy Checkbox */}
      <label className="auth-terms-row" htmlFor="agreedToTerms">
        <input
          id="agreedToTerms"
          name="agreedToTerms"
          type="checkbox"
          checked={formData.agreedToTerms}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={loading || Boolean(successMessage)}
          className="auth-terms-checkbox"
          aria-describedby={errors.agreedToTerms ? 'terms-error' : undefined}
        />
        <span>
          I agree to the{' '}
          <span className="auth-terms-link">Terms of Service</span> and{' '}
          <span className="auth-terms-link">Privacy Policy</span>
        </span>
      </label>
      {touched.agreedToTerms && errors.agreedToTerms && (
        <div id="terms-error" className="form-error" role="alert" style={{ marginTop: '-0.75rem', marginBottom: 'var(--space-3)' }}>
          {errors.agreedToTerms}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        loading={loading}
        loadingText="Creating account..."
        disabled={Boolean(successMessage)}
        className="auth-submit-btn"
      >
        Create Account
      </Button>

      {/* Switch to Login */}
      <div className="auth-footer-switch">
        Already have an account?{' '}
        <Link to={PATHS.LOGIN} className="auth-footer-link">
          Sign in
        </Link>
      </div>
    </form>
  );
}
