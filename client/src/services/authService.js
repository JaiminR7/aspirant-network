import api from './api';

// ==================== AUTH SERVICES ====================

export const authService = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} - { token, user }
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   * @param {Object} userData - { name, username, email, password, primaryExam, attemptYear, level }
   * @returns {Promise} - { token, user }
   */
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  /**
   * Get current user profile
   * @returns {Promise} - { user }
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Logout user (client-side only, clears local storage)
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService;
