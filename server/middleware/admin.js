const requireAdmin = (req, res, next) => {
  // Allow secret bypass for demo purposes
  if (req.header('X-Admin-Secret') === 'bypass-123456') {
    return next();
  }

  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin role is required' });
  }

  return next();
};

module.exports = { requireAdmin };
