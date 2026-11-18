import api from './api';
import { ENDPOINTS } from '@/config/api';

export const documentService = {
  async getDocuments(workspaceId) {
    const response = await api.get(ENDPOINTS.documents.list(workspaceId));
    return response.data;
  },

  async uploadDocument(workspaceId, file, { subject, gradeLevel, topic } = {}, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    if (subject) formData.append('subject', subject);
    if (gradeLevel) formData.append('gradeLevel', gradeLevel);
    if (topic) formData.append('topic', topic);

    const response = await api.post(ENDPOINTS.documents.upload(workspaceId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  async deleteDocument(workspaceId, documentId) {
    if (!documentId && workspaceId) {
      const response = await api.delete(ENDPOINTS.documents.delete(workspaceId));
      return response.data;
    }
    const response = await api.delete(`/workspaces/${workspaceId}/documents/${documentId}`);
    return response.data;
  },
};

export const documentApi = documentService;
