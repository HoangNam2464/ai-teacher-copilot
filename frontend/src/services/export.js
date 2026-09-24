import api from './api';
import { downloadBlob } from '@/utils/downloadHelper';
import { generateFormattedDocumentBlob } from '@/utils/documentGenerator';

export const exportService = {
  /**
   * Export a generated document (Lesson Plan or Quiz) as DOCX or PDF.
   *
   * @param {Object} params
   * @param {string} params.workspaceId - ID of active workspace
   * @param {string} params.generationId - ID of generation record
   * @param {string} [params.format='DOCX'] - 'DOCX' | 'PDF'
   * @param {string} [params.defaultFileName='tai-lieu'] - Base file name
   * @param {boolean} [params.includeCitations=true] - Whether to include citations appendix
   * @param {Object} [params.planData=null] - Lesson plan data for content grounding and client fallback
   * @param {string} [params.subject=''] - Subject name
   * @param {string} [params.gradeLevel=''] - Grade level
   * @returns {Promise<boolean>}
   */
  async exportDocument({
    workspaceId,
    generationId,
    format = 'DOCX',
    defaultFileName = 'tai-lieu',
    includeCitations = true,
    planData = null,
    subject = '',
    gradeLevel = '',
  }) {
    const mimeTypes = {
      PDF: 'application/pdf',
      DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    const targetFormat = (format || 'DOCX').toUpperCase();
    const extension = targetFormat.toLowerCase();
    const cleanFileName = defaultFileName.endsWith(`.${extension}`)
      ? defaultFileName
      : `${defaultFileName}.${extension}`;

    // 1. Send export request to backend following the official API contract:
    //    POST /api/workspaces/{workspaceId}/export/{generationId}?format={format}
    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/export/${generationId}?format=${targetFormat}`,
        {
          includeCitations,
          fileName: cleanFileName,
          contentData: planData,
        },
        { responseType: 'blob' }
      );

      downloadBlob(response.data, cleanFileName, mimeTypes[targetFormat] || 'application/octet-stream');
      return true;
    } catch (err) {
      console.warn('Backend export endpoint returned error:', err);

      // Extract error message from blob if server responded with JSON error
      let errorMessage = '';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          errorMessage = parsed.message || parsed.error || '';
        } catch {
          // not json
        }
      }

      const status = err.response?.status;

      // If user lacks permission (403), throw explicit error
      if (status === 403) {
        throw new Error(
          errorMessage || 'Thầy/Cô không có quyền truy cập hoặc xuất tài liệu trong không gian làm việc này.'
        );
      }

      // If server error (500), throw explicit server error
      if (status >= 500) {
        throw new Error(
          errorMessage || 'Máy chủ đang gặp sự cố khi tạo tệp tài liệu. Thầy/Cô vui lòng thử lại sau giây lát.'
        );
      }

      // If endpoint is not yet mounted in backend (404) and we have planData available,
      // generate a high-fidelity client document so the teacher's work can be downloaded immediately
      if ((status === 404 || !status) && planData) {
        try {
          const clientBlob = generateFormattedDocumentBlob({
            plan: planData,
            title: planData.title || defaultFileName,
            subject,
            gradeLevel,
            durationMinutes: planData.duration_minutes,
            includeCitations,
            format: targetFormat,
          });

          if (targetFormat === 'PDF') {
            // For PDF with HTML blob, open printable view or download
            const blobUrl = URL.createObjectURL(clientBlob);
            const printWindow = window.open(blobUrl, '_blank');
            if (printWindow) {
              printWindow.onload = () => {
                printWindow.print();
              };
            } else {
              downloadBlob(clientBlob, `${cleanFileName}.html`, 'text/html');
            }
          } else {
            // For Word (.docx / .doc), download directly
            downloadBlob(clientBlob, cleanFileName, 'application/msword');
          }
          return true;
        } catch (genErr) {
          console.error('Client generation fallback error:', genErr);
          throw new Error('Không thể khởi tạo tệp tài liệu trên thiết bị. Vui lòng thử lại.');
        }
      }

      // Otherwise rethrow detailed error
      throw new Error(
        errorMessage ||
          err.message ||
          'Không thể kết nối đến máy chủ để tải xuống tài liệu. Vui lòng kiểm tra lại kết nối mạng.'
      );
    }
  },
};

export const exportApi = exportService;
