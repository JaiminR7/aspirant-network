import api from './api';

// ==================== ANSWER SERVICES ====================

export const answerService = {
  /**
   * Get answers for a question (primary nested route)
   * @param {string} questionId - Question ID
   * @param {Object} params - { page, limit, sortBy }
   * @returns {Promise} - { answers, pagination }
   */
  getByQuestion: async (questionId, params = {}) => {
    const response = await api.get(`/questions/${questionId}/answers`, { params });
    return response.data;
  },

  /**
   * Get answers for a question (named alias — preserved API contract)
   * @param {string} questionId - Question ID
   * @param {Object} params - { page, limit, sortBy }
   * @returns {Promise} - { answers, pagination }
   */
  getAnswersByQuestion: async (questionId, params = {}) => {
    const response = await api.get(`/answers/question/${questionId}`, { params });
    return response.data;
  },

  /**
   * Create an answer
   * @param {Object} answerData - { questionId, content, isAnonymous }
   * @returns {Promise} - { answer }
   */
  create: async (questionId, answerData) => {
    const response = await api.post(`/questions/${questionId}/answers`, answerData);
    return response.data;
  },

  /**
   * Update an answer
   * @param {string} questionId - Question ID
   * @param {string} id - Answer ID
   * @param {Object} updateData - { content }
   * @returns {Promise} - { answer }
   */
  update: async (questionId, id, updateData) => {
    const response = await api.put(`/questions/${questionId}/answers/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete an answer
   * @param {string} questionId - Question ID
   * @param {string} id - Answer ID
   * @returns {Promise}
   */
  delete: async (questionId, id) => {
    const response = await api.delete(`/questions/${questionId}/answers/${id}`);
    return response.data;
  },

  /**
   * Upvote an answer
   * @param {string} questionId - Question ID
   * @param {string} id - Answer ID
   * @returns {Promise} - { likesCount, dislikesCount, userVoteStatus }
   */
  upvote: async (questionId, id) => {
    const response = await api.post(`/questions/${questionId}/answers/${id}/upvote`);
    return response.data;
  },

  /**
   * Downvote an answer
   * @param {string} questionId - Question ID
   * @param {string} id - Answer ID
   * @returns {Promise} - { likesCount, dislikesCount, userVoteStatus }
   */
  downvote: async (questionId, id) => {
    const response = await api.post(`/questions/${questionId}/answers/${id}/downvote`);
    return response.data;
  },

  /**
   * Vote on an answer
   * @param {string} questionId - Question ID
   * @param {string} id - Answer ID
   * @param {string} voteType - 'up' or 'down'
   * @returns {Promise} - { upvotes, downvotes, userVote }
   */
  vote: async (questionId, id, voteType) => {
    const response = await api.post(`/questions/${questionId}/answers/${id}/vote`, { voteType });
    return response.data;
  },

  /**
   * Accept an answer (mark as best answer)
   * @param {string} id - Answer ID
   * @returns {Promise}
   */
  accept: async (id) => {
    const response = await api.post(`/answers/${id}/accept`);
    return response.data;
  },

  /**
   * Get answers by a specific user
   * @param {string} userId - User ID
   * @param {Object} params - { page, limit }
   * @returns {Promise} - { answers, pagination }
   */
  getAnswersByUser: async (userId, params = {}) => {
    const response = await api.get('/answers', { params: { ...params, author: userId } });
    return response.data;
  },

  /**
   * Get my answers
   * @param {Object} params - { page, limit }
   * @returns {Promise} - { answers, pagination }
   */
  getMyAnswers: async (params = {}) => {
    const response = await api.get('/answers/my', { params });
    return response.data;
  }
};

export default answerService;
