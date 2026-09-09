import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert } from '@/components/ui/Alert';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { GoogleIcon, AppleIcon } from '@/components/ui/Icons';
import { validateEmail } from '@/utils/validators';
import { PATHS } from '@/routes/paths';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

export function LoginForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError] = useState(null);

  const [googleReady, setGoogleReady] = useState(false);
  const [appleReady, setAppleReady] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message;

  // Initialize Google Sign-In SDK
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
        });
        setGoogleReady(true);
      }
    };

    if (!document.getElementById('google-signin-script')) {
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
  }, []);

  // Initialize Apple Sign-In SDK
  useEffect(() => {
    if (!APPLE_CLIENT_ID) return;

    const initApple = () => {
      if (window.AppleID?.auth) {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: APPLE_REDIRECT_URI,
          usePopup: true,
        });
        setAppleReady(true);
      }
    };

    if (!document.getElementById('apple-signin-script')) {
      const script = document.createElement('script');
      script.id = 'apple-signin-script';
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      script.onload = initApple;
      document.body.appendChild(script);
    } else {
      initApple();
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    setSocialLoading('google');
    setError(null);

    try {
      const res = await authService.googleAuth(response.credential);
      const authData = res?.data || res;
      const token = authData?.token || authData?.accessToken;
      if (token) {
        setAuth(token, {
          email: authData.email,
          fullName: authData.fullName,
          role: authData.role || 'TEACHER',
        });
      }
      const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
      navigate(hasCompletedOnboarding ? PATHS.WORKSPACES : PATHS.ONBOARDING);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        t('auth.googleFailed')
      );
    } finally {
      setSocialLoading('');
    }
  };

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID || !googleReady || !window.google?.accounts?.id) {
      setError(t('auth.googleNotConfigured'));
      return;
    }
    window.google.accounts.id.prompt();
  };

  const handleAppleSignIn = async () => {
    if (!APPLE_CLIENT_ID || !appleReady || !window.AppleID?.auth) {
      setError(t('auth.appleNotConfigured'));
      return;
    }

    setSocialLoading('apple');
    setError(null);

    try {
      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      const fullName = response?.user?.name
        ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim()
        : null;

      const res = await authService.appleAuth(idToken, fullName);
      const authData = res?.data || res;
      const token = authData?.token || authData?.accessToken;
      if (token) {
        setAuth(token, {
          email: authData.email,
          fullName: authData.fullName,
          role: authData.role || 'TEACHER',
        });
      }
      const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
      navigate(hasCompletedOnboarding ? PATHS.WORKSPACES : PATHS.ONBOARDING);
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err?.message || t('auth.appleFailed'));
      }
    } finally {
      setSocialLoading('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (!validateEmail(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (!password) {
      setError(t('auth.passwordPlaceholder'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(email.trim(), password);
      const authData = response?.data || response;
      const token = authData?.token || authData?.accessToken;
      if (token) {
        setAuth(token, {
          email: authData.email || email.trim(),
          fullName: authData.fullName || '',
          role: authData.role || 'TEACHER',
        });
      }
      const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';
      navigate(hasCompletedOnboarding ? PATHS.WORKSPACES : PATHS.ONBOARDING);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t('auth.loginFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Social Login Buttons: Google & Apple (Template Standard) */}
      <div className="flex justify-center gap-4">
        {/* Google */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-14 h-14 p-0 rounded-xl transition-all duration-200 hover:scale-105 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 shadow-sm"
          onClick={handleGoogleSignIn}
          disabled={isLoading || socialLoading !== ''}
          title={t('auth.googleLogin')}
        >
          {socialLoading === 'google' ? (
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          ) : (
            <GoogleIcon size={22} />
          )}
        </Button>

        {/* Apple */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-14 h-14 p-0 rounded-xl transition-all duration-200 hover:scale-105 bg-black hover:bg-gray-900 text-white shadow-sm"
          onClick={handleAppleSignIn}
          disabled={isLoading || socialLoading !== ''}
          title={t('auth.appleLogin')}
        >
          {socialLoading === 'apple' ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <AppleIcon size={22} />
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 font-medium">
            {t('auth.orEmail')}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
            required
            disabled={isLoading || socialLoading !== ''}
            className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.password')}
            </Label>
            <Link
              to={PATHS.FORGOT_PASSWORD}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
              disabled={isLoading || socialLoading !== ''}
              className="h-11 pr-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || socialLoading !== ''}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200 mt-2"
          disabled={isLoading || socialLoading !== ''}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.signingIn')}
            </>
          ) : (
            t('auth.loginButton')
          )}
        </Button>
      </form>

      {/* Bottom Link */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('auth.noAccount')}{' '}
          <Link
            to={PATHS.REGISTER}
            className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {t('auth.registerFree')}
          </Link>
        </p>
      </div>
    </div>
  );
}
