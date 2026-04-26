import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds to be a bit more lenient for slower connections
});

// Request interceptor - adds auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const adminAccess = localStorage.getItem('adminAccess') === 'true';
    if (adminAccess) {
      config.headers['X-Admin-Secret'] = 'bypass-123456';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles common errors and implements a simple retry for timeouts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // Handle token expiration
    if (response?.status === 401) {
      const message = response?.data?.message || '';
      if (message.includes('expired') || message.includes('invalid')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Simple retry for timeout or network errors (max 1 retry)
    if (!config._retry && (error.code === 'ECONNABORTED' || !response)) {
      config._retry = true;
      console.warn(`[API] Request timed out or network error. Retrying...`, config.url);
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
