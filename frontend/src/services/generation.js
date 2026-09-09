import api from './api';

/**
 * Generation Service (Lesson Planner & Quiz Generator)
 * Kept minimal for sprint implementation.
 */
export const lessonPlannerApi = {
  async generateLessonPlan(workspaceId, data) {
    const response = await api.post(`/workspaces/${workspaceId}/generations/lesson-plan`, data);
    return response.data;
  },

  async getLessonPlanById(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}`);
    return response.data;
  },
};

export const quizApi = {
  async generateQuiz(workspaceId, data) {
    const response = await api.post(`/workspaces/${workspaceId}/generations/quiz`, data);
    return response.data;
  },

  async getQuizById(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}`);
    return response.data;
  },
};
