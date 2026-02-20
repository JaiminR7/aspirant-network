import api from './api';

export const activityService = {
  // Get user activities
  getActivities: async (params = {}) => {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const response = await api.get('/activities', {
      params: { page, limit, unreadOnly }
    });
    return response.data;
  },

  // Mark activity as read
  markAsRead: async (activityId) => {
    const response = await api.patch(`/activities/${activityId}/read`);
    return response.data;
  },

  // Mark all activities as read
  markAllAsRead: async () => {
    const response = await api.patch('/activities/read-all');
    return response.data;
  }
};
