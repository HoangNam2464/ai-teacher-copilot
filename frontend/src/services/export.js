import api from './api';
import { downloadBlob } from '@/utils/downloadHelper';

export const exportService = {
  async exportDocument(workspaceId, generationId, format = 'PDF', defaultFileName = 'document') {
    const mimeTypes = {
      PDF: 'application/pdf',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const extension = format.toLowerCase();
    const fileName = `${defaultFileName}.${extension}`;

    const response = await api.post(
      `/workspaces/${workspaceId}/generations/${generationId}/export?format=${format}`,
      {},
      { responseType: 'blob' }
    );

    downloadBlob(response.data, fileName, mimeTypes[format]);
    return true;
  },
};
