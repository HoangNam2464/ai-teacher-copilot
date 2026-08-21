import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PATHS } from './paths';
import { PrivateRoute } from './PrivateRoute';
import { DashboardLayout } from '../../core/layouts/DashboardLayout';
import { AuthLayout } from '../../core/layouts/AuthLayout';

import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { WorkspaceListPage } from '../../features/workspace/pages/WorkspaceListPage';
import { DocumentManagementPage } from '../../features/documents/pages/DocumentManagementPage';
import { LessonPlannerPage } from '../../features/lesson-planner/pages/LessonPlannerPage';
import { QuizGeneratorPage } from '../../features/quiz-generator/pages/QuizGeneratorPage';
import { HistoryListPage } from '../../features/history/pages/HistoryListPage';

export function AppRoutes() {
  return (
    <Routes>

      <Route element={<AuthLayout />}>
        <Route path={PATHS.LOGIN} element={<LoginPage />} />
        <Route path={PATHS.REGISTER} element={<RegisterPage />} />
      </Route>

      <Route
        path={PATHS.ROOT}
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to={PATHS.WORKSPACES} replace />} />
        <Route path={PATHS.WORKSPACES} element={<WorkspaceListPage />} />
        <Route path={PATHS.DOCUMENTS} element={<DocumentManagementPage />} />
        <Route path={PATHS.LESSON_PLANNER} element={<LessonPlannerPage />} />
        <Route path={PATHS.QUIZ_GENERATOR} element={<QuizGeneratorPage />} />
        <Route path={PATHS.HISTORY} element={<HistoryListPage />} />
      </Route>

      <Route path="*" element={<Navigate to={PATHS.ROOT} replace />} />
    </Routes>
  );
}
