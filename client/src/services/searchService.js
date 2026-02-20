import api from './api';

// ==================== SEARCH SERVICES ====================

export const searchService = {
  /**
   * Global search across all content types
   * @param {Object} params - { q, type, page, limit, subject, sortBy }
   * @returns {Promise} - { results, pagination }
   */
  search: async (params) => {
    const response = await api.get('/search', { params });
    return response.data;
  },

  /**
   * Search questions only
   * @param {Object} params - { q, page, limit, subject, topic, difficulty }
   * @returns {Promise} - { questions, pagination }
   */
  searchQuestions: async (params) => {
    const response = await api.get('/search/questions', { params });
    return response.data;
  },

  /**
   * Search resources only
   * @param {Object} params - { q, page, limit, type, subject }
   * @returns {Promise} - { resources, pagination }
   */
  searchResources: async (params) => {
    const response = await api.get('/search/resources', { params });
    return response.data;
  },

  /**
   * Search users only
   * @param {Object} params - { q, page, limit, exam }
   * @returns {Promise} - { users, pagination }
   */
  searchUsers: async (params) => {
    const response = await api.get('/search/users', { params });
    return response.data;
  },

  /**
   * Get search suggestions (autocomplete)
   * @param {string} query - Search query
   * @returns {Promise} - { suggestions }
   */
  getSuggestions: async (query) => {
    const response = await api.get('/search/suggestions', { params: { q: query } });
    return response.data;
  },

  /**
   * Get trending searches
   * @returns {Promise} - { trending }
   */
  getTrending: async () => {
    const response = await api.get('/search/trending');
    return response.data;
  }
};

export default searchService;
