import api from './api';

// ==================== USER SERVICES ====================

export const userService = {
  /**
   * Get current logged-in user profile
   * @returns {Promise} - { user }
   */
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Update current user profile
   * @param {Object} updateData - { name, bio, goal, attemptYear, level, privacy, profilePicture }
   * @returns {Promise} - { user }
   */
  updateProfile: async (updateData) => {
    const response = await api.put('/users/me', updateData);
    return response.data;
  },

  /**
   * Change password
   * @param {Object} passwords - { currentPassword, newPassword }
   * @returns {Promise}
   */
  changePassword: async (passwords) => {
    const response = await api.put('/users/me/password', passwords);
    return response.data;
  },

  /**
   * Change primary exam
   * @param {string} primaryExam - New primary exam
   * @returns {Promise} - { primaryExam }
   */
  changePrimaryExam: async (primaryExam) => {
    const response = await api.put('/users/me/exam', { primaryExam });
    return response.data;
  },

  /**
   * Get saved items (questions, resources, stories)
   * @param {string} type - 'all', 'questions', 'resources', or 'stories'
   * @returns {Promise} - { saved }
   */
  getSavedItems: async (type = 'all') => {
    const response = await api.get('/users/me/saved', { params: { type } });
    return response.data;
  },

  /**
   * Get blocked users
   * @returns {Promise} - { blockedUsers }
   */
  getBlockedUsers: async () => {
    const response = await api.get('/users/me/blocked');
    return response.data;
  },

  /**
   * Delete/deactivate account
   * @param {string} password - User's password for confirmation
   * @returns {Promise}
   */
  deleteAccount: async (password) => {
    const response = await api.delete('/users/me', { data: { password } });
    return response.data;
  },

  /**
   * Get user profile by username
   * @param {string} username - Username
   * @returns {Promise} - { user }
   */
  getProfile: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  /**
   * Get user activity
   * @param {string} username - Username
   * @param {Object} params - { type, page, limit }
   * @returns {Promise} - { activity, stats }
   */
  getUserActivity: async (username, params = {}) => {
    const response = await api.get(`/users/${username}/activity`, { params });
    return response.data;
  },

  /**
   * Block a user
   * @param {string} userId - User ID to block
   * @returns {Promise}
   */
  blockUser: async (userId) => {
    const response = await api.post(`/users/${userId}/block`);
    return response.data;
  },

  /**
   * Unblock a user
   * @param {string} userId - User ID to unblock
   * @returns {Promise}
   */
  unblockUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/block`);
    return response.data;
  },

  /**
   * Search users
   * @param {Object} params - { q, exam, page, limit }
   * @returns {Promise} - { users, pagination }
   */
  searchUsers: async (params) => {
    const response = await api.get('/users/search', { params });
    return response.data;
  },

  /**
   * Get leaderboard
   * @param {Object} params - { exam, limit }
   * @returns {Promise} - { leaderboard }
   */
  getLeaderboard: async (params = {}) => {
    const response = await api.get('/users/leaderboard', { params });
    return response.data;
  },

  /**
   * Upload profile picture
   * @param {FormData} formData - Form data with image file
   * @returns {Promise} - { profilePicture }
   */
  uploadProfilePicture: async (formData) => {
    const response = await api.post('/users/me/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default userService;
