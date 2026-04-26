import api from './api';

export const postsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/posts', {
      params: {
        ...params
      }
    });
    return response.data;
  },

  getFeed: async (params = {}) => {
    const response = await api.get('/posts/feed', {
      params: {
        ...params
      }
    });
    return response.data;
  },

  getPostById: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  toggleInteraction: async (postId, type) => {
    const response = await api.post('/interactions/toggle', {
      postId,
      type
    });
    return response.data;
  },

  getCommentsByPost: async (postId) => {
    const response = await api.get(`/comments/${postId}`);
    return response.data;
  },

  addComment: async (postId, text) => {
    const response = await api.post('/comments', {
      postId,
      text
    });
    return response.data;
  },

  savePost: async (id) => {
    const response = await api.post(`/posts/${id}/save`);
    return response.data;
  },

  unsavePost: async (id) => {
    const response = await api.delete(`/posts/${id}/save`);
    return response.data;
  },

  getSavedPosts: async (type = 'all') => {
    const response = await api.get('/posts/saved', { params: { type } });
    return response.data;
  }
};
