import api from './api';
import { ENDPOINTS } from '@/config/api';

export const documentService = {
  async getDocuments(workspaceId) {
    const response = await api.get(ENDPOINTS.documents.list(workspaceId));
    return response.data;
  },

  async uploadDocument(workspaceId, file, { subject, gradeLevel, topic } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (subject) formData.append('subject', subject);
    if (gradeLevel) formData.append('gradeLevel', gradeLevel);
    if (topic) formData.append('topic', topic);

    const response = await api.post(ENDPOINTS.documents.upload(workspaceId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteDocument(documentId) {
    const response = await api.delete(ENDPOINTS.documents.delete(documentId));
    return response.data;
  },
};

export const documentApi = documentService;
