import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/routes/paths';
import { PrivateRoute } from '@/routes/PrivateRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';
import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage';
import { WorkspaceListPage } from '@/pages/workspace/WorkspaceListPage';
import { DocumentManagementPage } from '@/pages/documents/DocumentManagementPage';
import { LessonPlannerPage } from '@/pages/lesson-planner/LessonPlannerPage';
import { QuizGeneratorPage } from '@/pages/quiz-generator/QuizGeneratorPage';
import { HistoryListPage } from '@/pages/history/HistoryListPage';
import { HomePage } from '@/pages/landing/HomePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfileSettingsPage } from '@/pages/settings/ProfileSettingsPage';
import { AccountSettingsPage } from '@/pages/settings/AccountSettingsPage';
import { AppearanceSettingsPage } from '@/pages/settings/AppearanceSettingsPage';
import { NotificationSettingsPage } from '@/pages/settings/NotificationSettingsPage';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Minimal 404
function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">{t('notFound.title')}</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          {t('notFound.description')}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          {t('notFound.backToHome')}
        </Link>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Landing (with Header + Footer) */}
        <Route element={<PublicLayout />}>
          <Route path={PATHS.ROOT} element={<HomePage />} />
        </Route>

        {/* Auth Routes (Unauthenticated Layout) */}
        <Route element={<AuthLayout />}>
          <Route path={PATHS.LOGIN} element={<LoginPage />} />
          <Route path={PATHS.REGISTER} element={<RegisterPage />} />
          <Route path={PATHS.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
          <Route path={PATHS.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        </Route>

        {/* Welcome Tour & Onboarding (Accessible to all) */}
        <Route path={PATHS.WELCOME} element={<OnboardingPage />} />
        <Route path={PATHS.ONBOARDING} element={<OnboardingPage />} />

        {/* Protected Application Routes (Dashboard Layout) */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardHomePage />} />
          <Route path="/dashboard/workspace" element={<WorkspaceListPage />} />
          <Route path="/dashboard/workspaces" element={<Navigate to="/dashboard/workspace" replace />} />
          <Route path="/workspaces" element={<Navigate to="/dashboard/workspace" replace />} />
          <Route path={PATHS.DOCUMENTS} element={<DocumentManagementPage />} />
          <Route path={PATHS.LESSON_PLANNER} element={<LessonPlannerPage />} />
          <Route path={PATHS.QUIZ_GENERATOR} element={<QuizGeneratorPage />} />
          <Route path={PATHS.HISTORY} element={<HistoryListPage />} />
          
          {/* Settings & Subscription */}
          <Route path={PATHS.SETTINGS.ROOT} element={<SettingsPage />} />
          <Route path={PATHS.SETTINGS.PROFILE} element={<ProfileSettingsPage />} />
          <Route path={PATHS.SETTINGS.ACCOUNT} element={<AccountSettingsPage />} />
          <Route path={PATHS.SETTINGS.APPEARANCE} element={<AppearanceSettingsPage />} />
          <Route path={PATHS.SETTINGS.NOTIFICATIONS} element={<NotificationSettingsPage />} />
          <Route path={PATHS.SETTINGS.SUBSCRIPTION} element={<AccountSettingsPage />} />

          {/* Backward compatibility redirects */}
          <Route path="/settings" element={<Navigate to={PATHS.SETTINGS.ROOT} replace />} />
          <Route path="/settings/profile" element={<Navigate to={PATHS.SETTINGS.PROFILE} replace />} />
          <Route path="/settings/account" element={<Navigate to={PATHS.SETTINGS.ACCOUNT} replace />} />
          <Route path="/settings/appearance" element={<Navigate to={PATHS.SETTINGS.APPEARANCE} replace />} />
          <Route path="/settings/notifications" element={<Navigate to={PATHS.SETTINGS.NOTIFICATIONS} replace />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
