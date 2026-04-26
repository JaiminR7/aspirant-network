/**
 * Admin Authorization Middleware
 * Ensures that only users with admin role can access protected admin routes
 * CRITICAL: This must always be called after the auth middleware
 */

const adminAuth = (req, res, next) => {
  try {
    // Verify user is authenticated (auth middleware should have run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // User is authenticated and is admin, proceed
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

module.exports = { adminAuth };
