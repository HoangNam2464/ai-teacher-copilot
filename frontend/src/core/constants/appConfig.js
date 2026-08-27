export const APP_CONFIG = {
  APP_NAME: 'AI Teacher Copilot',
  VERSION: '0.1.0',
  MAX_UPLOAD_SIZE_MB: 50,
  SUPPORTED_FILE_TYPES: ['.pdf', '.docx', '.txt'],
  BLOOM_LEVELS: [
    { value: 'Remember', label: 'Nhận biết (Remember)', color: 'var(--color-bloom-remember)' },
    { value: 'Understand', label: 'Thông hiểu (Understand)', color: 'var(--color-bloom-understand)' },
    { value: 'Apply', label: 'Vận dụng (Apply)', color: 'var(--color-bloom-apply)' },
    { value: 'Analyze', label: 'Phân tích (Analyze)', color: 'var(--color-bloom-analyze)' },
    { value: 'Evaluate', label: 'Đánh giá (Evaluate)', color: 'var(--color-bloom-evaluate)' },
    { value: 'Create', label: 'Sáng tạo (Create)', color: 'var(--color-bloom-create)' },
  ],
  DIFFICULTY_LEVELS: [
    { value: 'EASY', label: 'Dễ (Cơ bản)' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HARD', label: 'Nâng cao' },
  ],
};
