import api from './api';

// ==================== ANSWER SERVICES ====================

export const answerService = {
  /**
   * Get answers for a question
   * @param {string} questionId - Question ID
   * @param {Object} params - { page, limit, sortBy }
   * @returns {Promise} - { answers, pagination }
   */
  getByQuestion: async (questionId, params = {}) => {
    const response = await api.get(`/answers/question/${questionId}`, { params });
    return response.data;
  },

  /**
   * Create an answer
   * @param {Object} answerData - { questionId, content, isAnonymous }
   * @returns {Promise} - { answer }
   */
  create: async (answerData) => {
    const response = await api.post('/answers', answerData);
    return response.data;
  },

  /**
   * Update an answer
   * @param {string} id - Answer ID
   * @param {Object} updateData - { content }
   * @returns {Promise} - { answer }
   */
  update: async (id, updateData) => {
    const response = await api.put(`/answers/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete an answer
   * @param {string} id - Answer ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/answers/${id}`);
    return response.data;
  },

  /**
   * Vote on an answer
   * @param {string} id - Answer ID
   * @param {string} voteType - 'up' or 'down'
   * @returns {Promise} - { upvotes, downvotes, userVote }
   */
  vote: async (id, voteType) => {
    const response = await api.post(`/answers/${id}/vote`, { voteType });
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
