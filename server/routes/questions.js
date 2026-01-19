const express = require('express');
const router = express.Router();

// Import middleware
const { auth, optionalAuth } = require('../middleware/auth');
const { 
  enforceExamContext, 
  validateExamContextForCreation 
} = require('../middleware/examContext');

// Import controller (to be created)
const questionController = require('../controllers/questionController');

// ==================== ROUTES ====================

/**
 * @route   POST /api/questions
 * @desc    Create a new question
 * @access  Protected (requires auth + exam context validation)
 */
router.post(
  '/',
  auth,
  validateExamContextForCreation,
  questionController.createQuestion
);

/**
 * @route   GET /api/questions
 * @desc    Get all questions for user's exam (with pagination, filters, sorting)
 * @access  Protected (requires auth + exam context enforcement)
 * @query   page, limit, subject, topic, difficulty, sortBy, search, unanswered, solved
 */
router.get(
  '/',
  auth,
  enforceExamContext,
  questionController.getQuestions
);

/**
 * @route   GET /api/questions/trending
 * @desc    Get trending questions for user's exam
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/trending',
  auth,
  enforceExamContext,
  questionController.getTrendingQuestions
);

/**
 * @route   GET /api/questions/unanswered
 * @desc    Get unanswered questions for user's exam
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/unanswered',
  auth,
  enforceExamContext,
  questionController.getUnansweredQuestions
);

/**
 * @route   GET /api/questions/:id
 * @desc    Get single question by ID
 * @access  Public (can view questions with optional auth for voting status)
 */
router.get(
  '/:id',
  optionalAuth,
  enforceExamContext,
  questionController.getQuestionById
);

/**
 * @route   PATCH /api/questions/:id/solve
 * @desc    Mark question as solved
 * @access  Protected (requires auth + ownership check)
 */
router.patch(
  '/:id/solve',
  auth,
  enforceExamContext,
  questionController.markQuestionSolved
);

/**
 * @route   PATCH /api/questions/:id/vote
 * @desc    Upvote or downvote a question
 * @access  Protected (requires auth)
 * @body    { voteType: 'upvote' | 'downvote' | 'remove' }
 */
router.patch(
  '/:id/vote',
  auth,
  enforceExamContext,
  questionController.voteQuestion
);

/**
 * @route   PATCH /api/questions/:id
 * @desc    Update question
 * @access  Protected (requires auth + ownership)
 */
router.patch(
  '/:id',
  auth,
  enforceExamContext,
  questionController.updateQuestion
);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Delete question
 * @access  Protected (requires auth + ownership)
 */
router.delete(
  '/:id',
  auth,
  enforceExamContext,
  questionController.deleteQuestion
);

/**
 * @route   GET /api/questions/user/:userId
 * @desc    Get all questions by a specific user
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/user/:userId',
  auth,
  enforceExamContext,
  questionController.getUserQuestions
);

/**
 * @route   GET /api/questions/subject/:subjectId
 * @desc    Get questions by subject
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/subject/:subjectId',
  auth,
  enforceExamContext,
  questionController.getQuestionsBySubject
);

/**
 * @route   GET /api/questions/topic/:topicId
 * @desc    Get questions by topic
 * @access  Protected (requires auth + exam context enforcement)
 */
router.get(
  '/topic/:topicId',
  auth,
  enforceExamContext,
  questionController.getQuestionsByTopic
);

module.exports = router;
