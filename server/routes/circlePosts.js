const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const {
  createCirclePost,
  getCirclePosts,
  deleteCirclePost,
  upvoteCirclePost,
  downvoteCirclePost,
  addCommentToCirclePost,
} = require('../controllers/circlePostController');

router.post('/', auth, validateExamContext, createCirclePost);
router.get('/:circleId', auth, validateExamContext, getCirclePosts);
router.delete('/:id', auth, validateExamContext, deleteCirclePost);
router.post('/:id/upvote', auth, validateExamContext, upvoteCirclePost);
router.post('/:id/downvote', auth, validateExamContext, downvoteCirclePost);
router.post('/:id/comments', auth, validateExamContext, addCommentToCirclePost);

module.exports = router;
