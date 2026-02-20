const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { getTopicById } = require('../controllers/subjectController');

router.get('/:id', auth, validateExamContext, getTopicById);

module.exports = router;
