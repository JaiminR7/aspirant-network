const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { getSubjects, getTopicsBySubject, getSubjectById, getTopicById } = require('../controllers/subjectController');

router.get('/', auth, validateExamContext, getSubjects);
router.get('/:id', auth, validateExamContext, getSubjectById);
router.get('/:subjectId/topics', auth, validateExamContext, getTopicsBySubject);

module.exports = router;
