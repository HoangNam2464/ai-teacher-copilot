/**
 * Centralized Backend API Endpoints Dictionary
 */
export const ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',

  // Workspace
  WORKSPACES: '/api/workspaces',
  WORKSPACE_BY_ID: (id) => `/api/workspaces/${id}`,

  // Documents
  DOCUMENTS: (workspaceId) => `/api/workspaces/${workspaceId}/documents`,
  DOCUMENT_UPLOAD: (workspaceId) => `/api/workspaces/${workspaceId}/documents/upload`,
  DOCUMENT_BY_ID: (workspaceId, documentId) => `/api/workspaces/${workspaceId}/documents/${documentId}`,

  // Generation
  GENERATE_LESSON: (workspaceId) => `/api/workspaces/${workspaceId}/generation/lesson-plan`,
  GENERATE_QUIZ: (workspaceId) => `/api/workspaces/${workspaceId}/generation/quiz`,
  GENERATION_HISTORY: (workspaceId) => `/api/workspaces/${workspaceId}/generation/history`,
  GENERATION_BY_ID: (workspaceId, id) => `/api/workspaces/${workspaceId}/generation/${id}`,
  GENERATION_REGENERATE: (workspaceId, id) => `/api/workspaces/${workspaceId}/generation/${id}/regenerate`,

  // Citations
  CITATIONS_RESOLVE: (workspaceId) => `/api/workspaces/${workspaceId}/citations/resolve`,

  // Export
  EXPORT: (workspaceId, generationId) => `/api/workspaces/${workspaceId}/export/${generationId}`,
};
