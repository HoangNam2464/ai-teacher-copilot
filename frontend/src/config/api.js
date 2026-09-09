export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
};

export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    google: '/auth/google',
    apple: '/auth/apple',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    changePassword: '/auth/change-password',
  },

  // Workspaces
  workspaces: {
    list: '/workspaces',
    create: '/workspaces',
    get: (id) => `/workspaces/${id}`,
    update: (id) => `/workspaces/${id}`,
    delete: (id) => `/workspaces/${id}`,
  },

  // Documents
  documents: {
    list: (workspaceId) => `/workspaces/${workspaceId}/documents`,
    upload: (workspaceId) => `/workspaces/${workspaceId}/documents`,
    get: (id) => `/documents/${id}`,
    delete: (id) => `/documents/${id}`,
  },

  // History & Generations
  history: {
    list: (workspaceId) => `/workspaces/${workspaceId}/history`,
    get: (id) => `/history/${id}`,
    delete: (id) => `/history/${id}`,
  },

  // Export
  export: {
    docx: (id) => `/export/${id}/docx`,
    pdf: (id) => `/export/${id}/pdf`,
  },
};
