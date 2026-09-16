/**
 * Single Source of Truth (SSOT) Route Dictionary
 * All URL paths used across the application must be declared here.
 * Avoid hardcoding raw string paths in components.
 */
export const PATHS = {
  // Authentication
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  WELCOME: '/welcome',
  ONBOARDING: '/onboarding',

  // Core App & Dashboards
  ROOT: '/',
  DASHBOARD: '/dashboard',
  WORKSPACES: '/dashboard/workspace',
  DOCUMENTS: '/documents',

  // AI Content Generation
  LESSON_PLANNER: '/lesson-planner',
  LESSON_DETAIL: '/lesson-planner/:id',
  QUIZ_GENERATOR: '/quiz-generator',
  QUIZ_DETAIL: '/quiz-generator/:id',

  // Review & Lineage History
  HISTORY: '/history',
  HISTORY_DETAIL: '/history/:id',

  // Settings & Subscription
  SETTINGS: {
    ROOT: '/dashboard/settings',
    PROFILE: '/dashboard/settings/profile',
    ACCOUNT: '/dashboard/settings/account',
    APPEARANCE: '/dashboard/settings/appearance',
    NOTIFICATIONS: '/dashboard/settings/notifications',
    SUBSCRIPTION: '/dashboard/subscription',
  }
};
