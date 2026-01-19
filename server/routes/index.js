const express = require('express');
const router = express.Router();

// Import feature-specific routers
// Note: Create these router files as needed
const authRoutes = require('./auth');
const questionRoutes = require('./questions');
const answerRoutes = require('./answers');
const resourceRoutes = require('./resources');
const searchRoutes = require('./search');
const userRoutes = require('./users');
const subjectRoutes = require('./subjects');
const topicRoutes = require('./topics');
const chatRoutes = require('./chat');

// Health check route (public)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API info route (public)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aspirant Network API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      questions: '/api/questions',
      answers: '/api/answers',
      resources: '/api/resources',
      search: '/api/search',
      users: '/api/users',
      subjects: '/api/subjects',
      topics: '/api/topics',
      chat: '/api/chat'
    }
  });
});

// Mount feature-specific routers
// Auth routes (public - signup/login)
router.use('/auth', authRoutes);

// Question routes (protected - requires auth + exam context)
router.use('/questions', questionRoutes);

// Answer routes (protected - requires auth + exam context)
router.use('/answers', answerRoutes);

// Resource routes (protected - requires auth + exam context)
router.use('/resources', resourceRoutes);

// Search routes (protected - requires auth + exam context)
router.use('/search', searchRoutes);

// User routes (mixed - some public, some protected)
router.use('/users', userRoutes);

// Subject routes (mixed - public for listing, protected for creation)
router.use('/subjects', subjectRoutes);

// Topic routes (mixed - public for listing, protected for creation)
router.use('/topics', topicRoutes);

// Chat routes (protected - requires auth + strict validation)
router.use('/chat', chatRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      '/api/auth',
      '/api/questions',
      '/api/answers',
      '/api/resources',
      '/api/search',
      '/api/users',
      '/api/subjects',
      '/api/topics',
      '/api/chat'
    ]
  });
});

module.exports = router;
