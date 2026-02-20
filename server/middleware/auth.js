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
