import api from './api';

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Delete a user permanently with all owned content
   * @param {string} id - User ID
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getPosts: async (params = {}) => {
    const response = await api.get('/admin/posts', { params });
    return response.data;
  },

  /**
   * Delete a post permanently with all related data
   * @param {string} id - Post ID
   */
  deletePost: async (id) => {
    const response = await api.delete(`/admin/posts/${id}`);
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  }
};
