import api from './api';

export const circleService = {
  create: async (payload) => {
    const response = await api.post('/circles', payload);
    return response.data;
  },

  list: async (params = {}) => {
    const response = await api.get('/circles', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/circles/${id}`);
    return response.data;
  },

  addMessage: async (id, text) => {
    const response = await api.post(`/circles/${id}/message`, { text });
    return response.data;
  },
};

export const circlePostService = {
  create: async (payload) => {
    const response = await api.post('/circle-posts', payload);
    return response.data;
  },

  listByCircle: async (circleId, params = {}) => {
    const response = await api.get(`/circle-posts/${circleId}`, { params });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/circle-posts/${id}`);
    return response.data;
  },

  upvote: async (id) => {
    const response = await api.post(`/circle-posts/${id}/upvote`);
    return response.data;
  },

  downvote: async (id) => {
    const response = await api.post(`/circle-posts/${id}/downvote`);
    return response.data;
  },

  addComment: async (id, content) => {
    const response = await api.post(`/circle-posts/${id}/comments`, { content });
    return response.data;
  },
};

export default { circleService, circlePostService };
