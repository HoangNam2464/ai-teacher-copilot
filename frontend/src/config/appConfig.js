export const APP_CONFIG = {
  APP_NAME: 'AI Teacher Copilot',
  VERSION: '0.1.0',
  MAX_UPLOAD_SIZE_MB: 50,
  SUPPORTED_FILE_TYPES: ['.pdf', '.docx', '.txt'],
  BLOOM_LEVELS: [
    { value: 'Remember', label: 'Nhận biết (Remember)', badgeClass: 'bloom-badge--remember' },
    { value: 'Understand', label: 'Thông hiểu (Understand)', badgeClass: 'bloom-badge--understand' },
    { value: 'Apply', label: 'Vận dụng (Apply)', badgeClass: 'bloom-badge--apply' },
    { value: 'Analyze', label: 'Phân tích (Analyze)', badgeClass: 'bloom-badge--analyze' },
    { value: 'Evaluate', label: 'Đánh giá (Evaluate)', badgeClass: 'bloom-badge--evaluate' },
    { value: 'Create', label: 'Sáng tạo (Create)', badgeClass: 'bloom-badge--create' },
  ],
  DIFFICULTY_LEVELS: [
    { value: 'EASY', label: 'Dễ (Cơ bản)' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HARD', label: 'Nâng cao' },
  ],
};
