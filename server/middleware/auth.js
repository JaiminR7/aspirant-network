const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token and attaches user to request.
 * Token must be sent in Authorization header as: Bearer <token>
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if token has Bearer prefix
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Use: Bearer <token>'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    const user = await User.findById(decoded.userId)
      .select('-passwordHash'); // Exclude password

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated.'
      });
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    
    // CRITICAL: Attach exam context for exam-scoped queries
    req.examContext = user.primaryExam;

    // Update last active timestamp (optional, can be resource-intensive)
    // Uncomment if needed:
    // user.updateLastActive().catch(err => console.error('Error updating last active:', err));

    next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    // Generic error
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional Authentication Middleware
 * 
 * Attaches user if token is present, but doesn't reject if missing.
 * Useful for endpoints that work for both authenticated and anonymous users.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    // If no token, continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      req.examContext = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      req.userId = null;
      req.examContext = null;
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');

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
    // If token is invalid, continue without user
    req.user = null;
    req.userId = null;
    req.examContext = null;
    next();
  }
};

/**
 * Admin/Moderator Middleware
 * 
 * Requires user to be authenticated AND have admin/moderator role.
 * Should be used after the 'auth' middleware.
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Check if user has admin role (add role field to User model if needed)
  if (!req.user.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Ownership Middleware Generator
 * 
 * Checks if the authenticated user owns the resource.
 * Use this after auth middleware.
 * 
 * @param {string} resourceModel - Model name (e.g., 'Question', 'Answer')
 * @param {string} resourceIdParam - Request param name (e.g., 'id', 'questionId')
 * @param {string} ownerField - Field name in model (default: 'createdBy')
 */
const checkOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const resourceId = req.params[resourceIdParam];
      const Model = require(`../models/${resourceModel}`);
      
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceModel} not found.`
        });
      }

      // Check ownership
      if (resource[ownerField].toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      // Attach resource to request for reuse
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership.'
      });
    }
  };
};

/**
 * Generate JWT Token
 * 
 * Helper function to generate JWT token for user.
 * 
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    username: user.username,
    primaryExam: user.primaryExam,
    level: user.level
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' // 7 days default
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Verify Token (without database lookup)
 * 
 * Just verifies the token signature and expiry.
 * 
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  auth,
  optionalAuth,
  isAdmin,
  checkOwnership,
  generateToken,
  verifyToken
};
