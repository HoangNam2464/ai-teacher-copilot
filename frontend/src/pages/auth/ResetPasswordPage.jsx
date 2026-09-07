import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader2, BrainCircuit } from 'lucide-react';
import { authService as authApi } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PATHS } from '@/routes/paths';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.resetPasswordPage.notMatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.resetPasswordPage.minLength'));
      return;
    }

    if (!token) {
      setError(t('auth.resetPasswordPage.invalidToken'));
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        t('auth.resetPasswordPage.failed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl border border-white/50 dark:border-gray-800 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl">
      <CardHeader className="space-y-6 pb-6">
        <div className="flex flex-col items-center space-y-3">
          {/* Logo */}
          <Link to="/" className="group cursor-pointer mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
              <BrainCircuit className="w-9 h-9 text-white" />
            </div>
          </Link>

          {!token ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold text-foreground">
                  {t('auth.resetPasswordPage.invalidLink')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('auth.resetPasswordPage.invalidLinkDesc')}
                </CardDescription>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('auth.resetPasswordPage.success')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('auth.resetPasswordPage.successDesc')}
                </CardDescription>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1.5">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {t('auth.resetPasswordPage.title')}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('auth.resetPasswordPage.desc')}
              </CardDescription>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!token ? (
          <div className="space-y-4">
            <Button
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
              asChild
            >
              <Link to={PATHS.FORGOT_PASSWORD}>{t('auth.resetPasswordPage.requestNewLink')}</Link>
            </Button>
            <Button variant="outline" className="w-full h-11" asChild>
              <Link to={PATHS.LOGIN}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.backToLogin')}
              </Link>
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4">
            <Button
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
              asChild
            >
              <Link to={PATHS.LOGIN}>{t('auth.verifyEmailPage.loginNow')}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.newPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  className="h-11 pr-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('auth.confirmPassword')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  className="h-11 pr-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.resetPasswordPage.updating')}
                </>
              ) : (
                t('auth.resetPasswordPage.submit')
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                to={PATHS.LOGIN}
                className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
