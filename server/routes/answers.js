const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { getAllAnswers, getAnswersByQuestionDirect, updateAnswer, deleteAnswer, markAccepted, upvoteAnswer, downvoteAnswer } = require('../controllers/answerController');

// Get all answers (for user profile, etc.)
router.get('/', auth, validateExamContext, getAllAnswers);

// Restore original API contract: GET /api/answers/question/:questionId
router.get('/question/:questionId', auth, validateExamContext, getAnswersByQuestionDirect);

// Individual answer operations (by answer ID)
router.patch('/:id', auth, validateExamContext, updateAnswer);
router.delete('/:id', auth, validateExamContext, deleteAnswer);
router.patch('/:id/accept', auth, validateExamContext, markAccepted);
router.post('/:id/upvote', auth, validateExamContext, upvoteAnswer);
router.post('/:id/downvote', auth, validateExamContext, downvoteAnswer);

module.exports = router;
