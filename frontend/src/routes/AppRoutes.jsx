import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { PrivateRoute } from '@/routes/PrivateRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

// Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { WorkspaceListPage } from '@/pages/workspace/WorkspaceListPage';
import { DocumentManagementPage } from '@/pages/documents/DocumentManagementPage';
import { LessonPlannerPage } from '@/pages/lesson-planner/LessonPlannerPage';
import { QuizGeneratorPage } from '@/pages/quiz-generator/QuizGeneratorPage';
import { HistoryListPage } from '@/pages/history/HistoryListPage';
import { HomePage } from '@/pages/landing/HomePage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing (with Header + Footer) */}
      <Route element={<PublicLayout />}>
        <Route path={PATHS.ROOT} element={<HomePage />} />
      </Route>

      {/* Auth Routes (Unauthenticated Layout) */}
      <Route element={<AuthLayout />}>
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* Protected Application Routes (Dashboard Layout) */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path={PATHS.WORKSPACES} element={<WorkspaceListPage />} />
        <Route path={PATHS.DOCUMENTS} element={<DocumentManagementPage />} />
        <Route path={PATHS.LESSON_PLANNER} element={<LessonPlannerPage />} />
        <Route path={PATHS.QUIZ_GENERATOR} element={<QuizGeneratorPage />} />
        <Route path={PATHS.HISTORY} element={<HistoryListPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={PATHS.ROOT} replace />} />
    </Routes>
  );
}
