import apiClient from '@/services/core/client';
import { ENDPOINTS } from '@/services/core/endpoints';

export const documentApi = {
  async getDocuments(workspaceId) {
    const response = await apiClient.get(ENDPOINTS.DOCUMENTS(workspaceId));
    return response.data;
  },

  async uploadDocument(workspaceId, file, { subject, gradeLevel, topic } = {}) {
    const formData = new FormData();
    formData.append('file', file);
    if (subject) formData.append('subject', subject);
    if (gradeLevel) formData.append('gradeLevel', gradeLevel);
    if (topic) formData.append('topic', topic);

    const response = await apiClient.post(ENDPOINTS.DOCUMENT_UPLOAD(workspaceId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteDocument(workspaceId, documentId) {
    const response = await apiClient.delete(ENDPOINTS.DOCUMENT_BY_ID(workspaceId, documentId));
    return response.data;
  },
};
