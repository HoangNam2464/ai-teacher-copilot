import apiClient from '../../../core/services/client';
import { ENDPOINTS } from '../../../core/services/endpoints';

export const quizApi = {
  async generateQuiz(workspaceId, data) {
    const response = await apiClient.post(ENDPOINTS.GENERATE_QUIZ(workspaceId), data);
    return response.data;
  },

  async getQuizById(workspaceId, id) {
    const response = await apiClient.get(ENDPOINTS.GENERATION_BY_ID(workspaceId, id));
    return response.data;
  },
};
