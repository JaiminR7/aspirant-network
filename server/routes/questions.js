const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion, markSolved, upvoteQuestion, downvoteQuestion, getTrendingQuestions } = require('../controllers/questionController');
const { createAnswer, getAnswersByQuestion, upvoteAnswer, downvoteAnswer } = require('../controllers/answerController');

router.get('/trending', auth, validateExamContext, getTrendingQuestions);
router.post('/', auth, validateExamContext, createQuestion);
router.get('/', auth, validateExamContext, getAllQuestions);
router.get('/:id', auth, validateExamContext, getQuestionById);
router.patch('/:id', auth, validateExamContext, updateQuestion);
router.delete('/:id', auth, validateExamContext, deleteQuestion);
router.patch('/:id/solve', auth, validateExamContext, markSolved);
router.post('/:id/upvote', auth, validateExamContext, upvoteQuestion);
router.post('/:id/downvote', auth, validateExamContext, downvoteQuestion);

// Answer routes nested under questions
router.post('/:questionId/answers', auth, validateExamContext, createAnswer);
router.get('/:questionId/answers', auth, validateExamContext, getAnswersByQuestion);
router.post('/:questionId/answers/:answerId/upvote', auth, validateExamContext, upvoteAnswer);
router.post('/:questionId/answers/:answerId/downvote', auth, validateExamContext, downvoteAnswer);

module.exports = router;
