import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import { downloadBlob } from '../utils/downloadHelper';

/**
 * Shared Export Service — handles downloading generated lesson plans & quizzes
 */
export const exportService = {
  /**
   * Export generated content as PDF or DOCX
   * @param {string} workspaceId
   * @param {string} generationId
   * @param {'PDF' | 'DOCX'} format
   * @param {string} defaultFileName
   */
  async exportDocument(workspaceId, generationId, format = 'PDF', defaultFileName = 'document') {
    const mimeTypes = {
      PDF: 'application/pdf',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const extension = format.toLowerCase();
    const fileName = `${defaultFileName}.${extension}`;

    const response = await apiClient.post(
      `${ENDPOINTS.EXPORT(workspaceId, generationId)}?format=${format}`,
      {},
      { responseType: 'blob' }
    );

    downloadBlob(response.data, fileName, mimeTypes[format]);
    return true;
  },
};
