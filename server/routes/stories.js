const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { getAllStories, getStoryById, createStory, updateStory, deleteStory } = require('../controllers/storyController');

router.get('/', auth, validateExamContext, getAllStories);
router.get('/:id', auth, validateExamContext, getStoryById);
router.post('/', auth, validateExamContext, createStory);
router.patch('/:id', auth, validateExamContext, updateStory);
router.delete('/:id', auth, validateExamContext, deleteStory);

module.exports = router;
