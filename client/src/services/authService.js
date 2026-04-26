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
   * Send OTP for email verification
   * @param {string} email - User's email
   * @returns {Promise}
   */
  sendOtp: async (email) => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  },

  /**
   * Verify OTP for email verification
   * @param {Object} data - { email, otp }
   * @returns {Promise}
   */
  verifyOtp: async (data) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  /**
   * Request password reset OTP
   * @param {string} email - User's email
   * @returns {Promise}
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Verify password reset OTP
   * @param {Object} data - { email, otp }
   * @returns {Promise}
   */
  verifyResetOtp: async (data) => {
    const response = await api.post('/auth/verify-reset-otp', data);
    return response.data;
  },

  /**
   * Reset password with OTP
   * @param {Object} data - { email, otp, password }
   * @returns {Promise}
   */
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
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
