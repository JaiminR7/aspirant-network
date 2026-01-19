const express = require('express');
const router = express.Router();

// Import middleware
const { auth, optionalAuth } = require('../middleware/auth');
const { 
  enforceExamContext, 
  validateExamContextForCreation 
} = require('../middleware/examContext');

// Import controller (to be created)
const answerController = require('../controllers/answerController');

// ==================== ROUTES ====================

/**
 * @route   POST /api/questions/:questionId/answers
 * @desc    Create an answer to a question
 * @access  Protected (requires auth + exam context validation)
 */
router.post(
  '/questions/:questionId/answers',
  auth,
  enforceExamContext,
  answerController.createAnswer
);

/**
 * @route   GET /api/questions/:questionId/answers
 * @desc    Get all answers for a question
 * @access  Public (with optional auth for vote status)
 */
router.get(
  '/questions/:questionId/answers',
  optionalAuth,
  enforceExamContext,
  answerController.getAnswersByQuestion
);

/**
 * @route   GET /api/answers/:id
 * @desc    Get single answer by ID
 * @access  Public (with optional auth for vote status)
 */
router.get(
  '/:id',
  optionalAuth,
  enforceExamContext,
  answerController.getAnswerById
);

/**
 * @route   PATCH /api/answers/:id
 * @desc    Update answer
 * @access  Protected (requires auth + ownership)
 */
router.patch(
  '/:id',
  auth,
  enforceExamContext,
  answerController.updateAnswer
);

/**
 * @route   DELETE /api/answers/:id
 * @desc    Delete answer
 * @access  Protected (requires auth + ownership)
 */
router.delete(
  '/:id',
  auth,
  enforceExamContext,
  answerController.deleteAnswer
);

/**
 * @route   PATCH /api/answers/:id/vote
 * @desc    Vote on an answer (upvote/downvote/remove)
 * @access  Protected (requires auth + exam context)
 * @body    { voteType: 'upvote' | 'downvote' | 'remove' }
 */
router.patch(
  '/:id/vote',
  auth,
  enforceExamContext,
  answerController.voteAnswer
);

/**
 * @route   PATCH /api/answers/:id/accept
 * @desc    Accept an answer as the solution (question owner only)
 * @access  Protected (requires auth + question ownership)
 */
router.patch(
  '/:id/accept',
  auth,
  enforceExamContext,
  answerController.acceptAnswer
);

/**
 * @route   PATCH /api/answers/:id/unaccept
 * @desc    Unaccept an answer (question owner only)
 * @access  Protected (requires auth + question ownership)
 */
router.patch(
  '/:id/unaccept',
  auth,
  enforceExamContext,
  answerController.unacceptAnswer
);

/**
 * @route   POST /api/answers/:id/comments
 * @desc    Add a comment to an answer
 * @access  Protected (requires auth + exam context)
 */
router.post(
  '/:id/comments',
  auth,
  enforceExamContext,
  answerController.addComment
);

/**
 * @route   DELETE /api/answers/:id/comments/:commentId
 * @desc    Delete a comment from an answer
 * @access  Protected (requires auth + ownership)
 */
router.delete(
  '/:id/comments/:commentId',
  auth,
  enforceExamContext,
  answerController.deleteComment
);

/**
 * @route   POST /api/answers/:id/chat-request
 * @desc    Send chat request to answer author
 * @access  Protected (requires auth + exam context)
 */
router.post(
  '/:id/chat-request',
  auth,
  enforceExamContext,
  answerController.sendChatRequest
);

/**
 * @route   GET /api/answers/user/:userId
 * @desc    Get all answers by a specific user
 * @access  Protected (requires auth + exam context)
 */
router.get(
  '/user/:userId',
  auth,
  enforceExamContext,
  answerController.getUserAnswers
);

module.exports = router;
