const express = require('express');
const router = express.Router();

// Import middleware
const { auth } = require('../middleware/auth');
const { enforceExamContext } = require('../middleware/examContext');

// Import controller
const searchController = require('../controllers/searchController');

// ==================== ROUTES ====================

/**
 * @route   GET /api/search
 * @desc    Global search across questions and resources
 * @access  Protected (requires auth + exam context enforcement)
 * @query   q (search term), type (question/resource/all), subject, topic, tags, page, limit, sortBy
 */
router.get(
  '/',
  auth,
  enforceExamContext,
  searchController.globalSearch
);

/**
 * @route   GET /api/search/questions
 * @desc    Search questions only with advanced filters
 * @access  Protected (requires auth + exam context enforcement)
 * @query   q, subject, topic, difficulty, tags, solved, hasAcceptedAnswer, page, limit, sortBy
 */
router.get(
  '/questions',
  auth,
  enforceExamContext,
  searchController.searchQuestions
);

/**
 * @route   GET /api/search/resources
 * @desc    Search resources only with advanced filters
 * @access  Protected (requires auth + exam context enforcement)
 * @query   q, subject, topic, type, tags, verified, page, limit, sortBy
 */
router.get(
  '/resources',
  auth,
  enforceExamContext,
  searchController.searchResources
);

/**
 * @route   GET /api/search/tags
 * @desc    Search content by tags
 * @access  Protected (requires auth + exam context enforcement)
 * @query   tags (array), type (question/resource/all), subject, topic, page, limit, sortBy
 */
router.get(
  '/tags',
  auth,
  enforceExamContext,
  searchController.searchByTags
);

/**
 * @route   GET /api/search/autocomplete
 * @desc    Get autocomplete suggestions for search
 * @access  Protected (requires auth + exam context enforcement)
 * @query   q (search term), type (question/resource/all)
 */
router.get(
  '/autocomplete',
  auth,
  enforceExamContext,
  searchController.autocomplete
);

module.exports = router;
