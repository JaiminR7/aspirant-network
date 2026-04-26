import api from './api';

// ==================== RESOURCE SERVICES ====================

export const resourceService = {
  /**
   * Get all resources with filters and pagination
   * @param {Object} params - { page, limit, type, subject, sortBy, search }
   * @returns {Promise} - { resources, pagination }
   */
  getResources: async (params = {}) => {
    const response = await api.get('/resources', { params });
    return response.data;
  },

  /**
   * Get top-rated resources
   * @param {number} limit - Number of resources to fetch
   * @returns {Promise} - { resources }
   */
  getTopRated: async (limit = 10) => {
    const response = await api.get('/resources/top-rated', { params: { limit } });
    return response.data;
  },

  /**
   * Get single resource by ID
   * @param {string} id - Resource ID
   * @returns {Promise} - { resource, userRating, hasSaved }
   */
  getById: async (id) => {
    const response = await api.get(`/resources/${id}`);
    return response.data;
  },

  /**
   * Create a new resource
   * @param {Object} resourceData - { title, description, type, url, subject, topic, userTags }
   * @returns {Promise} - { resource }
   */
  create: async (resourceData) => {
    const response = await api.post('/resources', resourceData);
    return response.data;
  },

  /**
   * Upload resource with file
   * @param {FormData} formData - Form data with file and resource details
   * @returns {Promise} - { resource }
   */
  upload: async (formData) => {
    const response = await api.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get download URL for a resource
   * @param {string} id - Resource ID
   * @returns {Promise} - { success, downloadUrl }
   */
  getDownloadUrl: async (id) => {
    const response = await api.get(`/resources/${id}/download`);
    return response.data;
  },

  /**
   * Update a resource
   * @param {string} id - Resource ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise} - { resource }
   */
  update: async (id, updateData) => {
    const response = await api.put(`/resources/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a resource
   * @param {string} id - Resource ID
   * @returns {Promise}
   */
  delete: async (id) => {
    const response = await api.delete(`/resources/${id}`);
    return response.data;
  },

  /**
   * Rate a resource
   * @param {string} id - Resource ID
   * @param {number} rating - Rating value (1-5)
   * @returns {Promise} - { averageRating, totalRatings }
   */
  rate: async (id, rating) => {
    const response = await api.post(`/resources/${id}/rate`, { rating });
    return response.data;
  },
 
  /**
   * Get user's rating for a resource
   * @param {string} id - Resource ID
   * @returns {Promise} - { rating }
   */
  getUserRating: async (id) => {
    const response = await api.get(`/resources/${id}/rating`);
    return response.data;
  },

  /**
   * Upvote a resource
   * @param {string} id - Resource ID
   * @returns {Promise} - { totalUpvotes, totalDownvotes, userVoteStatus }
   */
  upvote: async (id) => {
    const response = await api.post(`/resources/${id}/upvote`);
    return response.data;
  },

  /**
   * Downvote a resource
   * @param {string} id - Resource ID
   * @returns {Promise} - { totalUpvotes, totalDownvotes, userVoteStatus }
   */
  downvote: async (id) => {
    const response = await api.post(`/resources/${id}/downvote`);
    return response.data;
  },

  /**
   * Get trending resources
   * @param {number} limit - Number of resources to fetch
   * @returns {Promise} - { resources }
   */
  getTrending: async (limit = 10) => {
    const response = await api.get('/resources/trending', { params: { limit } });
    return response.data;
  },

  /**
   * Save/unsave a resource
   * @param {string} id - Resource ID
   * @returns {Promise} - { saved }
   */
  toggleSave: async (id) => {
    const response = await api.post(`/resources/${id}/save`);
    return response.data;
  },

  /**
   * Get my resources
   * @param {Object} params - { page, limit }
   * @returns {Promise} - { resources, pagination }
   */
  getMyResources: async (params = {}) => {
    const response = await api.get('/resources/my', { params });
    return response.data;
  }
};

export default resourceService;
