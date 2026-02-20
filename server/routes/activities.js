const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getUserActivities, markAsRead, markAllAsRead } = require('../controllers/activityController');

router.get('/', auth, getUserActivities);
router.patch('/:id/read', auth, markAsRead);
router.patch('/read-all', auth, markAllAsRead);

module.exports = router;
