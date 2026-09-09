import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft, BrainCircuit } from 'lucide-react';
import { authService as authApi } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PATHS } from '@/routes/paths';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || location.state?.email || '';

  const [verifying, setVerifying] = useState(Boolean(token));
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const executeVerify = async () => {
      setVerifying(true);
      setVerifyError(null);
      try {
        await authApi.verifyEmail(token);
        if (isMounted) {
          setVerifySuccess(true);
        }
      } catch (err) {
        if (isMounted) {
          setVerifyError(
            err.response?.data?.message ||
            err.message ||
            t('auth.verifyEmailPage.failedDesc')
          );
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    executeVerify();
    return () => {
      isMounted = false;
    };
  }, [token, t]);

  const handleResend = async () => {
    if (!emailParam) return;
    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      await authApi.resendVerification(emailParam);
      setResendSuccess(true);
    } catch (err) {
      setResendError(
        err.response?.data?.message ||
        err.message ||
        t('auth.verifyEmailPage.resendFailed')
      );
    } finally {
      setResending(false);
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

          {token ? (
            verifying ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto text-emerald-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('auth.verifyEmailPage.activating')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {t('auth.verifyEmailPage.activatingDesc')}
                  </CardDescription>
                </div>
              </div>
            ) : verifySuccess ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t('auth.verifyEmailPage.success')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {t('auth.verifyEmailPage.successDesc')}
                  </CardDescription>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {t('auth.verifyEmailPage.failed')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {verifyError || t('auth.verifyEmailPage.failedDesc')}
                  </CardDescription>
                </div>
              </div>
            )
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('auth.verifyEmailPage.title')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('auth.verifyEmailPage.desc')}{' '}
                  {emailParam ? (
                    <span className="font-medium text-gray-900 dark:text-white">{emailParam}</span>
                  ) : (
                    t('auth.verifyEmailPage.inbox')
                  )}
                </CardDescription>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {token ? (
          verifySuccess ? (
            <Button
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
              asChild
            >
              <Link to={PATHS.LOGIN}>{t('auth.verifyEmailPage.loginNow')}</Link>
            </Button>
          ) : !verifying ? (
            <Button
              variant="outline"
              className="w-full h-11"
              asChild
            >
              <Link to={PATHS.LOGIN}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.backToLogin')}
              </Link>
            </Button>
          ) : null
        ) : (
          <div className="space-y-4">
            {resendSuccess && (
              <div className="p-3 rounded-lg text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center">
                {t('auth.verifyEmailPage.resendSuccess')}
              </div>
            )}

            {resendError && <Alert variant="destructive">{resendError}</Alert>}

            {emailParam && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.verifyEmailPage.resending')}
                  </>
                ) : (
                  t('auth.verifyEmailPage.resendButton')
                )}
              </Button>
            )}

            <Button
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg transition-all duration-200"
              asChild
            >
              <Link to={PATHS.LOGIN}>{t('auth.backToLogin')}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
