const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const questionRoutes = require('./questions');
const answerRoutes = require('./answers');
const resourceRoutes = require('./resources');
const searchRoutes = require('./search');
const userRoutes = require('./users');
const storyRoutes = require('./stories');
const subjectRoutes = require('./subjects');
const topicRoutes = require('./topics');
const activityRoutes = require('./activities');

// Health check
router.get('/health', (req, res) => res.json({ success: true, status: 'running' }));
router.get('/', (req, res) => res.json({ success: true, message: 'Aspirant Network API v1.0.0' }));

// Auth routes
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

// Story routes (protected - requires auth + exam context)
router.use('/stories', storyRoutes);

// Subject routes (protected - requires auth + exam context)
router.use('/subjects', subjectRoutes);

// Topic routes (protected - requires auth + exam context)
router.use('/topics', topicRoutes);

// Activity routes (protected - requires auth)
router.use('/activities', activityRoutes);

module.exports = router;
