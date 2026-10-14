import api from './api';

/**
 * Generation Service (Lesson Planner, Quiz Generator, Refinement & Versioning)
 * Conforming to Rule 4 and BE-027 / FE-016 contracts.
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

  async updateLessonPlan(workspaceId, id, data) {
    const response = await api.put(`/workspaces/${workspaceId}/generations/${id}`, data);
    return response.data;
  },

  async regenerateLessonPlan(workspaceId, id, data) {
    const response = await api.post(`/workspaces/${workspaceId}/generations/${id}/regenerate`, data);
    return response.data;
  },

  async getLessonPlanVersions(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}/versions`);
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

  async regenerateQuiz(workspaceId, id, data) {
    const response = await api.post(`/workspaces/${workspaceId}/generations/${id}/regenerate`, data);
    return response.data;
  },

  async getQuizVersions(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}/versions`);
    return response.data;
  },
};

export const generationApi = {
  async regenerate(workspaceId, id, instructions) {
    const response = await api.post(`/workspaces/${workspaceId}/generations/${id}/regenerate`, { instructions });
    return response.data;
  },

  async getVersions(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}/versions`);
    return response.data;
  },
};

export const rubricApi = {
  async saveRubric(workspaceId, id, rubricData) {
    const response = await api.put(`/workspaces/${workspaceId}/generations/${id}`, {
      contentData: rubricData,
    });
    return response.data;
  },

  async getRubricById(workspaceId, id) {
    const response = await api.get(`/workspaces/${workspaceId}/generations/${id}`);
    return response.data;
  },
};
