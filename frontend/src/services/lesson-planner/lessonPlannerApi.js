import apiClient from '@/services/core/client';
import { ENDPOINTS } from '@/services/core/endpoints';

export const lessonPlannerApi = {
  async generateLessonPlan(workspaceId, data) {
    const response = await apiClient.post(ENDPOINTS.GENERATE_LESSON(workspaceId), data);
    return response.data;
  },

  async getLessonPlanById(workspaceId, id) {
    const response = await apiClient.get(ENDPOINTS.GENERATION_BY_ID(workspaceId, id));
    return response.data;
  },
};
