const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { createAnswer, getAnswersByQuestion, getAllAnswers, updateAnswer, deleteAnswer, markAccepted } = require('../controllers/answerController');

router.get('/', auth, validateExamContext, getAllAnswers);
router.post('/questions/:questionId/answers', auth, validateExamContext, createAnswer);
router.get('/questions/:questionId/answers', auth, validateExamContext, getAnswersByQuestion);
router.patch('/:id', auth, validateExamContext, updateAnswer);
router.delete('/:id', auth, validateExamContext, deleteAnswer);
router.patch('/:id/accept', auth, validateExamContext, markAccepted);

module.exports = router;
