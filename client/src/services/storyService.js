import api from './api';

// ==================== STORY SERVICES ====================

export const storyService = {
  /**
   * Get all stories with filters and pagination
   * @param {Object} params - { page, limit, storyType, sortBy, sortOrder, featured }
   * @returns {Promise} - { stories, pagination }
   */
  getStories: async (params = {}) => {
    const response = await api.get('/stories', { params });
    return response.data;
  },

  /**
   * Get trending stories
   * @param {number} limit - Number of stories to fetch
   * @returns {Promise} - { stories }
   */
  getTrending: async (limit = 10) => {
    const response = await api.get('/stories/trending', { params: { limit } });
    return response.data;
  },

  /**
   * Get featured stories
   * @param {number} limit - Number of stories to fetch
   * @returns {Promise} - { stories }
   */
  getFeatured: async (limit = 5) => {
    const response = await api.get('/stories/featured', { params: { limit } });
    return response.data;
  },

  /**
   * Get single story by ID
   * @param {string} id - Story ID
   * @returns {Promise} - { story, userVote, hasSaved }
   */
  getById: async (id) => {
    const response = await api.get(`/stories/${id}`);
    return response.data;
  },

  /**
   * Create a new story
   * @param {Object} storyData - { title, content, excerpt, storyType, tags, coverImage, isAnonymous, result, status }
   * @returns {Promise} - { story }
   */
  create: async (storyData) => {
    const response = await api.post('/stories', storyData);
    return response.data;
  },

  /**
   * Update a story
   * @param {string} id - Story ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise} - { story }
   */
  update: async (id, updateData) => {
    const response = await api.put(`/stories/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a story
   * @param {string} id - Story ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/stories/${id}`);
    return response.data;
  },

  /**
   * Vote on a story (upvote/downvote)
   * @param {string} id - Story ID
   * @param {string} voteType - 'up' or 'down'
   * @returns {Promise} - { upvotes, downvotes, userVote }
   */
  vote: async (id, voteType) => {
    const response = await api.post(`/stories/${id}/vote`, { voteType });
    return response.data;
  },

  /**
   * Save/unsave a story
   * @param {string} id - Story ID
   * @returns {Promise} - { saved }
   */
  toggleSave: async (id) => {
    const response = await api.post(`/stories/${id}/save`);
    return response.data;
  },

  /**
   * Add a comment to a story
   * @param {string} id - Story ID
   * @param {Object} commentData - { content, isAnonymous }
   * @returns {Promise} - { comments }
   */
  addComment: async (id, commentData) => {
    const response = await api.post(`/stories/${id}/comments`, commentData);
    return response.data;
  },

  /**
   * Delete a comment from a story
   * @param {string} storyId - Story ID
   * @param {string} commentId - Comment ID
   * @returns {Promise}
   */
  deleteComment: async (storyId, commentId) => {
    const response = await api.delete(`/stories/${storyId}/comments/${commentId}`);
    return response.data;
  },

  /**
   * Get stories by a specific user
   * @param {string} userId - User ID
   * @param {Object} params - { page, limit }
   * @returns {Promise} - { stories, pagination }
   */
  getUserStories: async (userId, params = {}) => {
    const response = await api.get(`/stories/user/${userId}`, { params });
    return response.data;
  },

  /**
   * Get my stories (including drafts)
   * @param {Object} params - { page, limit, status }
   * @returns {Promise} - { stories, pagination }
   */
  getMyStories: async (params = {}) => {
    const response = await api.get('/stories/my', { params });
    return response.data;
  }
};

export default storyService;
