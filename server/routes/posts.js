const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { 
  getPosts, 
  getPostById, 
  savePost, 
  unsavePost, 
  getSavedPosts 
} = require('../controllers/postController');

router.get('/', auth, getPosts);
router.get('/feed', auth, getPosts);
router.get('/saved', auth, getSavedPosts);
router.get('/:id', auth, getPostById);
router.post('/:id/save', auth, savePost);
router.delete('/:id/save', auth, unsavePost);

module.exports = router;
