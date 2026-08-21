export const ENDPOINTS = {

  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',

  WORKSPACES: '/api/workspaces',
  WORKSPACE_BY_ID: (id) => `/api/workspaces/${id}`,

  DOCUMENTS: (workspaceId) => `/api/workspaces/${workspaceId}/documents`,
  DOCUMENT_UPLOAD: (workspaceId) => `/api/workspaces/${workspaceId}/documents`,
  DOCUMENT_BY_ID: (workspaceId, documentId) => `/api/workspaces/${workspaceId}/documents/${documentId}`,

  GENERATE_LESSON: (workspaceId) => `/api/workspaces/${workspaceId}/generate/lesson-plan`,
  GENERATE_QUIZ: (workspaceId) => `/api/workspaces/${workspaceId}/generate/quiz`,
  GENERATION_HISTORY: (workspaceId) => `/api/workspaces/${workspaceId}/generation/history`,
  GENERATION_BY_ID: (workspaceId, id) => `/api/workspaces/${workspaceId}/generation/${id}`,
  GENERATION_REGENERATE: (workspaceId, id) => `/api/workspaces/${workspaceId}/generation/${id}/regenerate`,

  CITATIONS_RESOLVE: (workspaceId) => `/api/workspaces/${workspaceId}/citations/resolve`,

  EXPORT: (workspaceId, generationId) => `/api/workspaces/${workspaceId}/export/${generationId}`,
};
