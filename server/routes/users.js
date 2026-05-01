const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
  getUserProfile, 
  getMe, 
  updateProfile, 
  getUserActivity, 
  changePassword, 
  deleteAccount, 
  updateSettings, 
  changePrimaryExam,
  syncClerkUser,
  onboardUser
} = require('../controllers/userController');

// Clerk Sync & Onboarding
router.post('/sync', syncClerkUser);
router.post('/onboarding', onboardUser);

router.get('/me', auth, getMe);
router.patch('/me', auth, updateProfile);
router.put('/me/exam', auth, changePrimaryExam);
router.patch('/me/password', auth, changePassword);
router.delete('/me', auth, deleteAccount);
router.get('/me/activity', auth, getUserActivity);
router.patch('/settings', auth, updateSettings);
router.patch('/change-exam', auth, changePrimaryExam);
router.get('/:username', getUserProfile);

module.exports = router;
