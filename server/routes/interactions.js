const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { toggleInteraction } = require('../controllers/interactionController');

router.post('/toggle', auth, toggleInteraction);

module.exports = router;
