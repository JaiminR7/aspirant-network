const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { addComment, getCommentsByPost } = require('../controllers/commentController');

router.post('/', auth, addComment);
router.get('/:postId', auth, getCommentsByPost);

module.exports = router;
