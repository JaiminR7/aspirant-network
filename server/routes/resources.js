const express = require('express');
const router = express.Router();

// Import middleware
const { auth, optionalAuth } = require('../middleware/auth');
const { 
  enforceExamContext, 
  validateExamContextForCreation 
} = require('../middleware/examContext');

// Import controller (to be created)
const resourceController = require('../controllers/resourceController');

// ==================== ROUTES ====================

/**
 * @route   POST /api/resources
 * @desc    Create a new resource
 * @access  Protected (requires auth + exam context validation)
 */
router.post(
  '/',
  auth,
  validateExamContextForCreation,
  resourceController.createResource
);

/**
 * @route   GET /api/resources
 * @desc    Get all resources for user's exam (with pagination, filters, sorting)
 * @access  Protected (requires auth + exam context enforcement)
 * @query   page, limit, type, subject, topic, verified, sortBy, search
 */
router.get(
  '/',
  auth,
  enforceExamContext,
  resourceController.getResources
);

/**
 * @route   GET /api/resources/top-rated
 * @desc    Get top-rated resources for user's exam
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/top-rated',
  auth,
  enforceExamContext,
  resourceController.getTopRatedResources
);

/**
 * @route   GET /api/resources/most-saved
 * @desc    Get most saved resources for user's exam
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/most-saved',
  auth,
  enforceExamContext,
  resourceController.getMostSavedResources
);

/**
 * @route   GET /api/resources/verified
 * @desc    Get verified resources for user's exam
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/verified',
  auth,
  enforceExamContext,
  resourceController.getVerifiedResources
);

/**
 * @route   GET /api/resources/saved
 * @desc    Get user's saved resources
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/saved',
  auth,
  enforceExamContext,
  resourceController.getSavedResources
);

/**
 * @route   GET /api/resources/:id
 * @desc    Get single resource by ID
 * @access  Public (can view resources with optional auth for save/rate status)
 */
router.get(
  '/:id',
  optionalAuth,
  enforceExamContext,
  resourceController.getResourceById
);

/**
 * @route   PATCH /api/resources/:id/rate
 * @desc    Rate a resource (1-5 stars)
 * @access  Protected (requires auth)
 * @body    { rating: number (1-5) }
 */
router.patch(
  '/:id/rate',
  auth,
  enforceExamContext,
  resourceController.rateResource
);

/**
 * @route   POST /api/resources/:id/save
 * @desc    Save/unsave resource to library
 * @access  Protected (requires auth)
 */
router.post(
  '/:id/save',
  auth,
  enforceExamContext,
  resourceController.toggleSaveResource
);

/**
 * @route   PATCH /api/resources/:id
 * @desc    Update resource
 * @access  Protected (requires auth + ownership)
 */
router.patch(
  '/:id',
  auth,
  enforceExamContext,
  resourceController.updateResource
);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete resource
 * @access  Protected (requires auth + ownership)
 */
router.delete(
  '/:id',
  auth,
  enforceExamContext,
  resourceController.deleteResource
);

/**
 * @route   POST /api/resources/:id/comments
 * @desc    Add a comment to a resource
 * @access  Protected (requires auth + exam context)
 */
router.post(
  '/:id/comments',
  auth,
  enforceExamContext,
  resourceController.addComment
);

/**
 * @route   DELETE /api/resources/:id/comments/:commentId
 * @desc    Delete a comment from a resource
 * @access  Protected (requires auth + ownership)
 */
router.delete(
  '/:id/comments/:commentId',
  auth,
  enforceExamContext,
  resourceController.deleteComment
);

/**
 * @route   PATCH /api/resources/:id/verify
 * @desc    Verify a resource (admin only)
 * @access  Protected (requires auth + admin)
 */
router.patch(
  '/:id/verify',
  auth,
  enforceExamContext,
  resourceController.verifyResource
);

/**
 * @route   GET /api/resources/user/:userId
 * @desc    Get all resources by a specific user
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/user/:userId',
  auth,
  enforceExamContext,
  resourceController.getUserResources
);

/**
 * @route   GET /api/resources/subject/:subjectId
 * @desc    Get resources by subject
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/subject/:subjectId',
  auth,
  enforceExamContext,
  resourceController.getResourcesBySubject
);

/**
 * @route   GET /api/resources/topic/:topicId
 * @desc    Get resources by topic
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/topic/:topicId',
  auth,
  enforceExamContext,
  resourceController.getResourcesByTopic
);

/**
 * @route   GET /api/resources/type/:type
 * @desc    Get resources by type (PDF, Image, Link, Video)
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/type/:type',
  auth,
  enforceExamContext,
  resourceController.getResourcesByType
);

module.exports = router;
