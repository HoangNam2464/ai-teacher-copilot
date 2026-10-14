import api from './api';
import { downloadBlob } from '@/utils/downloadHelper';
import {
  generateFormattedDocumentBlob,
  generateFormattedQuizBlob,
} from '@/utils/documentGenerator';

export const exportService = {
  /**
   * Export a generated document (Lesson Plan or Quiz) as DOCX or PDF.
   * Supports Student Exam Sheet and Teacher Answer Key modes (FE-019 / ATC-406).
   *
   * @param {Object} params
   * @param {string} params.workspaceId - ID of active workspace
   * @param {string} params.generationId - ID of generation record
   * @param {string} [params.format='DOCX'] - 'DOCX' | 'PDF'
   * @param {string} [params.defaultFileName='tai-lieu'] - Base file name
   * @param {boolean} [params.includeCitations=true] - Whether to include citations appendix
   * @param {Object} [params.planData=null] - Document / Quiz data for content grounding and client fallback
   * @param {string} [params.subject=''] - Subject name
   * @param {string} [params.gradeLevel=''] - Grade level
   * @param {string} [params.exportMode='STUDENT_EXAM'] - 'STUDENT_EXAM' | 'TEACHER_KEY' | 'BOTH'
   * @param {string} [params.contentType=''] - 'QUIZ' | 'LESSON_PLAN'
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
    exportMode = 'STUDENT_EXAM',
    contentType = '',
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

    // Detect if content is a Quiz
    const isQuiz =
      contentType === 'QUIZ' ||
      Boolean(planData?.questions) ||
      Boolean(planData?.contentData?.questions) ||
      Boolean(planData?.data?.questions) ||
      Array.isArray(planData) ||
      defaultFileName.toLowerCase().includes('de-thi') ||
      defaultFileName.toLowerCase().includes('dap-an');

    // For Quiz documents, generate using client-side high-fidelity Quiz generator
    // strictly adhering to Student Exam Sheet vs Teacher Answer Key (FE-019)
    if (isQuiz && planData) {
      try {
        const clientBlob = generateFormattedQuizBlob({
          quiz: planData,
          title: planData.title || defaultFileName,
          subject,
          gradeLevel,
          exportMode,
          includeCitations: exportMode === 'STUDENT_EXAM' ? false : includeCitations,
          format: targetFormat,
        });

        if (targetFormat === 'PDF') {
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
          downloadBlob(clientBlob, cleanFileName, 'application/msword');
        }
        return true;
      } catch (genErr) {
        console.error('Quiz client export failed:', genErr);
        throw new Error('Không thể khởi tạo tệp đề kiểm tra trên thiết bị. Vui lòng thử lại.');
      }
    }

    // Otherwise send export request to backend for Lesson Plans:
    // POST /api/workspaces/{workspaceId}/export/{generationId}?format={format}
    try {
      const response = await api.post(
        `/workspaces/${workspaceId}/export/${generationId}?format=${targetFormat}`,
        {
          includeCitations,
          fileName: cleanFileName,
          contentData: planData,
          exportMode,
          contentType,
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

      // Fallback: If endpoint is not yet mounted in backend (404) and we have planData available,
      // generate a high-fidelity client document
      if ((status === 404 || !status) && planData) {
        try {
          const clientBlob = isQuiz
            ? generateFormattedQuizBlob({
                quiz: planData,
                title: planData.title || defaultFileName,
                subject,
                gradeLevel,
                exportMode,
                includeCitations,
                format: targetFormat,
              })
            : generateFormattedDocumentBlob({
                plan: planData,
                title: planData.title || defaultFileName,
                subject,
                gradeLevel,
                durationMinutes: planData.duration_minutes,
                includeCitations,
                format: targetFormat,
              });

          if (targetFormat === 'PDF') {
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
