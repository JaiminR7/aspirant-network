import api from './api';

// ==================== SUBJECT SERVICES ====================

export const subjectService = {
  /**
   * Get all subjects for user's exam
   * @returns {Promise} - { subjects }
   */
  getSubjects: async () => {
    const response = await api.get('/subjects');
    return response.data;
  },

  /**
   * Get single subject by ID
   * @param {string} id - Subject ID
   * @returns {Promise} - { subject }
   */
  getById: async (id) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Get topics for a specific subject
   * @param {string} subjectId - Subject ID
   * @returns {Promise} - { topics }
   */
  getTopicsBySubject: async (subjectId) => {
    const response = await api.get(`/subjects/${subjectId}/topics`);
    return response.data;
  },
};

// ==================== TOPIC SERVICES ====================

export const topicService = {
  /**
   * Get all topics for user's exam (optionally filtered by subject)
   * @param {Object} params - { subject }
   * @returns {Promise} - { topics }
   */
  getTopics: async (params = {}) => {
    const response = await api.get('/topics', { params });
    return response.data;
  },
};
