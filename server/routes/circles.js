const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createCircle,
  getCircles,
  getCircleById,
  addMessage,
} = require('../controllers/circleController');

console.log('[ROUTES] Circles routes file loaded');

router.post('/', auth, createCircle);
router.get('/', auth, getCircles);
router.get('/:id', auth, getCircleById);
router.post('/:id/message', auth, addMessage);

module.exports = router;
