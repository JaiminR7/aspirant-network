const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    if (!token) return res.status(401).json({ success: false, message: 'Token empty' });

    let user;
    
    // 1. Try to verify as a local JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id).select('-passwordHash');
    } catch (jwtErr) {
      // 2. If local JWT fails, check if it's a Clerk token
      // Note: In production, use Clerk SDK for verification
      const decoded = jwt.decode(token);
      if (decoded && decoded.sub) {
        // Find user by clerkId (sub is the clerkId in their JWT)
        user = await User.findOne({ clerkId: decoded.sub }).select('-passwordHash');
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or inactive user' });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been banned and is no longer accessible',
        code: 'USER_BANNED'
      });
    }

    req.user = user;
    req.userId = user._id;
    req.examContext = user.primaryExam;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      req.examContext = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      req.examContext = user.primaryExam;
    } else {
      req.user = null;
      req.userId = null;
      req.examContext = null;
    }
    next();
  } catch (error) {
    req.user = null;
    req.userId = null;
    req.examContext = null;
    next();
  }
};

module.exports = { auth, optionalAuth };
