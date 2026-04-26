const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { getAllStories, getStoryById, createStory, updateStory, deleteStory, upvoteStory, downvoteStory, getTrendingStories, saveStory, addComment, deleteComment } = require('../controllers/storyController');

router.get('/trending', auth, validateExamContext, getTrendingStories);
router.get('/', auth, validateExamContext, getAllStories);
router.get('/:id', auth, validateExamContext, getStoryById);
router.post('/', auth, validateExamContext, createStory);
router.patch('/:id', auth, validateExamContext, updateStory);
router.delete('/:id', auth, validateExamContext, deleteStory);
router.post('/:id/upvote', auth, validateExamContext, upvoteStory);
router.post('/:id/downvote', auth, validateExamContext, downvoteStory);
router.post('/:id/save', auth, validateExamContext, saveStory);
router.post('/:id/comments', auth, validateExamContext, addComment);
router.delete('/:id/comments/:commentId', auth, validateExamContext, deleteComment);

module.exports = router;
