const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getUserProfile, getMe, updateProfile, getUserActivity, changePassword, deleteAccount, updateSettings, changePrimaryExam } = require('../controllers/userController');

router.get('/me', auth, getMe);
router.patch('/me', auth, updateProfile);
router.patch('/me/password', auth, changePassword);
router.delete('/me', auth, deleteAccount);
router.get('/me/activity', auth, getUserActivity);
router.patch('/settings', auth, updateSettings);
router.patch('/change-exam', auth, changePrimaryExam);
router.get('/:username', getUserProfile);

module.exports = router;
