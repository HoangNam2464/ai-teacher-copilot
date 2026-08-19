import { PATHS } from '../../app/routes/paths';

/**
 * Config-driven Navigation Menu Configuration
 */
export const SIDEBAR_ITEMS = [
  {
    key: 'dashboard',
    label: 'Bảng điều khiển',
    path: PATHS.DASHBOARD,
    icon: '📊',
  },
  {
    key: 'workspaces',
    label: 'Không gian làm việc',
    path: PATHS.WORKSPACES,
    icon: '🏫',
  },
  {
    key: 'documents',
    label: 'Tài liệu & Học liệu',
    path: PATHS.DOCUMENTS,
    icon: '📚',
  },
  {
    key: 'lesson-planner',
    label: 'Soạn giáo án AI',
    path: PATHS.LESSON_PLANNER,
    icon: '📝',
  },
  {
    key: 'quiz-generator',
    label: 'Tạo đề thi & Quiz AI',
    path: PATHS.QUIZ_GENERATOR,
    icon: '🎯',
  },
  {
    key: 'history',
    label: 'Lịch sử & Bản nháp',
    path: PATHS.HISTORY,
    icon: '🕒',
  },
];
