import apiClient from './client';
import { ENDPOINTS } from './endpoints';
import { downloadBlob } from '../utils/downloadHelper';

export const exportService = {

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
