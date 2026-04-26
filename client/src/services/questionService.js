import api from './api';

// ==================== QUESTION SERVICES ====================

export const questionService = {
  /**
   * Get all questions with filters and pagination
   * @param {Object} params - { page, limit, subject, topic, difficulty, sortBy, search, unanswered, solved }
   * @returns {Promise} - { questions, pagination }
   */
  getQuestions: async (params = {}) => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  /**
   * Get trending questions
   * @param {number} limit - Number of questions to fetch
   * @returns {Promise} - { questions }
   */
  getTrending: async (limit = 10) => {
    const response = await api.get('/questions/trending', { params: { limit } });
    return response.data;
  },

  /**
   * Get unanswered questions
   * @param {Object} params - { page, limit }
   * @returns {Promise} - { questions, pagination }
   */
  getUnanswered: async (params = {}) => {
    const response = await api.get('/questions/unanswered', { params });
    return response.data;
  },

  /**
   * Get single question by ID
   * @param {string} id - Question ID
   * @returns {Promise} - { question, userVote, hasSaved }
   */
  getById: async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  /**
   * Create a new question
   * @param {Object} questionData - { title, description, subject, topic, difficulty, userTags, images, isAnonymous }
   * @returns {Promise} - { question }
   */
  create: async (questionData) => {
    const response = await api.post('/questions', questionData);
    return response.data;
  },

  /**
   * Update a question
   * @param {string} id - Question ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise} - { question }
   */
  update: async (id, updateData) => {
    const response = await api.put(`/questions/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a question
   * @param {string} id - Question ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },

  /**
   * Upvote a question
   * @param {string} id - Question ID
   * @returns {Promise} - { totalUpvotes, totalDownvotes, userVoteStatus }
   */
  upvote: async (id) => {
    const response = await api.post(`/questions/${id}/upvote`);
    return response.data;
  },

  /**
   * Downvote a question
   * @param {string} id - Question ID
   * @returns {Promise} - { totalUpvotes, totalDownvotes, userVoteStatus }
   */
  downvote: async (id) => {
    const response = await api.post(`/questions/${id}/downvote`);
    return response.data;
  },

  /**
   * Vote on a question (upvote/downvote)
   * @param {string} id - Question ID
   * @param {string} voteType - 'up' or 'down'
   * @returns {Promise} - { upvotes, downvotes, userVote }
   */
  vote: async (id, voteType) => {
    const response = await api.post(`/questions/${id}/vote`, { voteType });
    return response.data;
  },

  /**
   * Save/unsave a question
   * @param {string} id - Question ID
   * @returns {Promise} - { saved }
   */
  toggleSave: async (id) => {
    const response = await api.post(`/questions/${id}/save`);
    return response.data;
  },

  /**
   * Toggle question solved status
   * @param {string} id - Question ID
   * @returns {Promise}
   */
  toggleSolve: async (id) => {
    const response = await api.patch(`/questions/${id}/solve`);
    return response.data;
  },

  /**
   * Mark question as solved (with accepted answer)
   * @param {string} id - Question ID
   * @param {string} answerId - ID of the accepted answer
   * @returns {Promise}
   */
  markSolved: async (id, answerId) => {
    const response = await api.patch(`/questions/${id}/solve`, { answerId });
    return response.data;
  },

  /**
   * Get my questions
   * @param {Object} params - { page, limit }
   * @returns {Promise} - { questions, pagination }
   */
  getMyQuestions: async (params = {}) => {
    const response = await api.get('/questions/my', { params });
    return response.data;
  }
};

export default questionService;
