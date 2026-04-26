const express = require('express');

const { auth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const {
  getDashboardStats,
  getUsers,
  banUser,
  deleteUser,
  getPosts,
  deletePost,
  getReports,
  forceDeleteResource
} = require('../controllers/adminController');

const router = express.Router();

router.use(auth, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);
router.get('/reports', getReports);
router.delete('/resources/:id', forceDeleteResource);

module.exports = router;
