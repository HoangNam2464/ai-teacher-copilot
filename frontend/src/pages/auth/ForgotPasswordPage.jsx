import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Loader2, BrainCircuit } from 'lucide-react';
import { authService as authApi } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PATHS } from '@/routes/paths';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        t('auth.forgotPasswordPage.error')
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

          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('auth.forgotPasswordPage.checkEmail')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('auth.forgotPasswordPage.checkEmailDesc')}{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                </CardDescription>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1.5">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {t('auth.forgotPasswordPage.title')}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('auth.forgotPasswordPage.desc')}
              </CardDescription>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isSubmitted ? (
          <div className="space-y-5">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              {t('auth.forgotPasswordPage.notReceived')}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setError(null);
                }}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                {t('auth.forgotPasswordPage.tryAgain')}
              </button>
            </p>

            <Button variant="outline" className="w-full h-11" asChild>
              <Link to={PATHS.LOGIN} className="inline-flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.backToLogin')}
              </Link>
            </Button>
          </div>
        ) : (
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
                disabled={isLoading}
                className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.forgotPasswordPage.sending')}
                </>
              ) : (
                t('auth.forgotPasswordPage.submit')
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
