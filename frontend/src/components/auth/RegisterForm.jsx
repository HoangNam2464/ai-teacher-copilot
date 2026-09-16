import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { GoogleIcon, AppleIcon } from '@/components/ui/Icons';
import { validateEmail } from '@/utils/validators';
import { PATHS } from '@/routes/paths';
import { cn } from '@/lib/utils';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || '';
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

export function RegisterForm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [googleReady, setGoogleReady] = useState(false);
  const [appleReady, setAppleReady] = useState(false);
  const googleBtnRef = useRef(null);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

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

        if (googleBtnRef.current) {
          try {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              type: 'icon',
              shape: 'square',
              theme: 'outline',
              size: 'large',
            });
          } catch (e) {
            console.warn('Google renderButton:', e);
          }
        }
      }
    };

    const existingScript = document.getElementById('google-signin-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      existingScript.addEventListener('load', initGoogle);
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
        t('auth.register.googleFailed')
      );
    } finally {
      setSocialLoading('');
    }
  };

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID || !googleReady || !window.google?.accounts?.id) {
      setError(t('auth.register.googleFailed'));
      return;
    }
    try {
      window.google.accounts.id.prompt();
    } catch (e) {
      console.warn('Google prompt:', e);
    }
  };

  const handleAppleSignIn = async () => {
    if (!APPLE_CLIENT_ID || !appleReady || !window.AppleID?.auth) {
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
        setError(err?.message || t('auth.register.appleFailed'));
      }
    } finally {
      setSocialLoading('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errors = {};
    if (!name.trim()) {
      errors.name = t('auth.register.nameRequired');
    }

    if (!email.trim()) {
      errors.email = t('auth.register.emailRequired');
    } else if (!validateEmail(email.trim())) {
      errors.email = t('auth.register.emailInvalid');
    }

    if (!password) {
      errors.password = t('auth.passwordRequired');
    } else if (password.length < 8) {
      errors.password = t('auth.register.passwordMinLength');
    }

    if (!agreedToTerms) {
      errors.terms = t('auth.register.agreeTermsRequired');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register(name.trim(), email.trim(), password);
      const authData = response?.data || response;
      const token = authData?.token || authData?.accessToken;
      if (token) {
        setAuth(token, {
          email: authData.email || email.trim(),
          fullName: authData.fullName || name.trim(),
          role: authData.role || 'TEACHER',
        });
      }
      navigate(PATHS.ONBOARDING);
    } catch (err) {
      console.error('Register error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t('auth.register.signUpFailed')
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
        <div className="relative w-14 h-14">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-14 h-14 p-0 rounded-xl transition-all duration-200 hover:scale-105 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-700 shadow-sm flex items-center justify-center"
            onClick={handleGoogleSignIn}
            disabled={isLoading || socialLoading !== ''}
            title={t('auth.login.continueWithGoogle')}
          >
            {socialLoading === 'google' ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            ) : (
              <GoogleIcon size={22} />
            )}
          </Button>
          {/* Overlay Google native button: clicking always opens OAuth popup even if FedCM is disabled */}
          <div
            ref={googleBtnRef}
            className="absolute inset-0 opacity-0 overflow-hidden cursor-pointer"
            style={{ width: '56px', height: '56px' }}
          />
        </div>

        {/* Apple */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-14 h-14 p-0 rounded-xl transition-all duration-200 hover:scale-105 bg-black hover:bg-gray-900 text-white shadow-sm"
          onClick={handleAppleSignIn}
          disabled={isLoading || socialLoading !== ''}
          title={t('auth.login.continueWithApple')}
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
            {t('auth.register.orSignUpWithEmail')}
          </span>
        </div>
      </div>

      {/* Server / Form Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Registration Form with Inline Validation States */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.register.fullName')}
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder={t('auth.register.namePlaceholder')}
            disabled={isLoading || socialLoading !== ''}
            className={cn(
              'h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors',
              fieldErrors.name
                ? 'border-red-500 focus-visible:ring-red-500/20 text-red-950 dark:text-red-100'
                : 'focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500'
            )}
          />
          {fieldErrors.name && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.register.email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder={t('auth.register.emailPlaceholder')}
            disabled={isLoading || socialLoading !== ''}
            className={cn(
              'h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors',
              fieldErrors.email
                ? 'border-red-500 focus-visible:ring-red-500/20 text-red-950 dark:text-red-100'
                : 'focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500'
            )}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('auth.register.password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder={t('auth.register.passwordPlaceholder')}
              minLength={8}
              disabled={isLoading || socialLoading !== ''}
              className={cn(
                'h-11 pr-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors',
                fieldErrors.password
                  ? 'border-red-500 focus-visible:ring-red-500/20 text-red-950 dark:text-red-100'
                  : 'focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500'
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-11 w-11 p-0 hover:bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || socialLoading !== ''}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {fieldErrors.password ? (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{fieldErrors.password}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('auth.register.passwordHint')}
            </p>
          )}
        </div>

        {/* Terms & Privacy Checkbox */}
        <div className="space-y-1 pt-1">
          <div className="flex items-start space-x-2.5">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: '' }));
              }}
              disabled={isLoading || socialLoading !== ''}
              className={cn(
                'mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 dark:border-gray-600 dark:bg-gray-800 cursor-pointer',
                fieldErrors.terms && 'border-red-500 ring-1 ring-red-500'
              )}
            />
            <Label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400 leading-normal font-normal cursor-pointer">
              {t('auth.register.agreeToTerms')}{' '}
              <Link to="/terms" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                {t('auth.register.termsOfService')}
              </Link>
              {' & '}
              <Link to="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                {t('auth.register.privacyPolicy')}
              </Link>
            </Label>
          </div>
          {fieldErrors.terms && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{fieldErrors.terms}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200 mt-2"
          disabled={isLoading || socialLoading !== ''}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.register.creatingAccount')}
            </>
          ) : (
            t('auth.register.createAccount')
          )}
        </Button>
      </form>

      {/* Bottom Link */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('auth.register.haveAccount')}{' '}
          <Link
            to={PATHS.LOGIN}
            className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
