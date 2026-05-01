const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { validateExamContext } = require('../middleware/examContext');
const { uploadResource } = require('../middleware/upload');
const { 
  createResource, getAllResources, getResourceById, updateResource, 
  deleteResource, previewResource, downloadResource, getTopRatedResources, 
  upvoteResource, downvoteResource, getTrendingResources,
  rateResource, getUserResourceRating, addComment, deleteComment
} = require('../controllers/resourceController');

// Custom auth middleware for download route that accepts token from query or header
const authFlexible = async (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');

    let token = null;

    // Check for token in Authorization header first
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // If not in header, check query parameter
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or inactive user' });
    }

    req.user = user;
    req.userId = user._id;
    req.examContext = user.primaryExam;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired' });
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

router.post('/upload', auth, uploadResource.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const fileUrl = req.file.path || '';
  const isPdf = req.file.mimetype === 'application/pdf';

  // Clean URL: remove attachment flags and any other forced-download params
  const cleanUrl = String(fileUrl)
    .replace(/\/fl_attachment(?=\/|,|$)/g, '')
    .replace(/[?&]fl_attachment=[^&]*/g, '')
    .split('?')[0]; // Remove query params just in case

  res.json({
    success: true,
    data: {
      url: cleanUrl,
      viewerUrl: cleanUrl,
      publicId: req.file.filename,
      type: isPdf ? 'pdf' : req.file.mimetype?.startsWith('image/') ? 'image' : 'file',
    },
  });
});
router.get('/trending', auth, validateExamContext, getTrendingResources);
router.get('/top-rated', auth, validateExamContext, getTopRatedResources);
router.post('/', auth, validateExamContext, createResource);
router.get('/', auth, validateExamContext, getAllResources);
router.post('/:id/rate', auth, validateExamContext, rateResource);
router.post('/:id/comments', auth, validateExamContext, addComment);
router.delete('/:id/comments/:commentId', auth, validateExamContext, deleteComment);
router.get('/:id/rating', auth, validateExamContext, getUserResourceRating);
router.get('/:id/preview', auth, validateExamContext, previewResource);
router.get('/:id/download', authFlexible, validateExamContext, downloadResource);
router.get('/:id', auth, validateExamContext, getResourceById);
router.patch('/:id', auth, validateExamContext, updateResource);
router.delete('/:id', auth, validateExamContext, deleteResource);
router.post('/:id/upvote', auth, validateExamContext, upvoteResource);
router.post('/:id/downvote', auth, validateExamContext, downvoteResource);

module.exports = router;
