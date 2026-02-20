const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { globalSearch, searchQuestions, searchResources } = require('../controllers/searchController');

router.get('/', auth, validateExamContext, globalSearch);
router.get('/questions', auth, validateExamContext, searchQuestions);
router.get('/resources', auth, validateExamContext, searchResources);

module.exports = router;
