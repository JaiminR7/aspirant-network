const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { createQuestion, getAllQuestions, getQuestionById, updateQuestion, deleteQuestion, markSolved } = require('../controllers/questionController');
const { createAnswer, getAnswersByQuestion } = require('../controllers/answerController');

router.post('/', auth, validateExamContext, createQuestion);
router.get('/', auth, validateExamContext, getAllQuestions);
router.get('/:id', auth, validateExamContext, getQuestionById);
router.patch('/:id', auth, validateExamContext, updateQuestion);
router.delete('/:id', auth, validateExamContext, deleteQuestion);
router.patch('/:id/solve', auth, validateExamContext, markSolved);

// Answer routes nested under questions
router.post('/:questionId/answers', auth, validateExamContext, createAnswer);
router.get('/:questionId/answers', auth, validateExamContext, getAnswersByQuestion);

module.exports = router;
