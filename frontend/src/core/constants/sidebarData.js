import { PATHS } from '../../app/routes/paths';

export const SIDEBAR_ITEMS = [
  {
    key: 'dashboard',
    label: 'Bảng điều khiển',
    path: PATHS.DASHBOARD,
    iconName: 'dashboard',
  },
  {
    key: 'workspaces',
    label: 'Không gian làm việc',
    path: PATHS.WORKSPACES,
    iconName: 'workspaces',
  },
  {
    key: 'documents',
    label: 'Tài liệu & Học liệu',
    path: PATHS.DOCUMENTS,
    iconName: 'documents',
  },
  {
    key: 'lesson-planner',
    label: 'Soạn giáo án AI',
    path: PATHS.LESSON_PLANNER,
    iconName: 'lesson-planner',
  },
  {
    key: 'quiz-generator',
    label: 'Tạo đề thi & Quiz AI',
    path: PATHS.QUIZ_GENERATOR,
    iconName: 'quiz-generator',
  },
  {
    key: 'history',
    label: 'Lịch sử & Bản nháp',
    path: PATHS.HISTORY,
    iconName: 'history',
  },
];
