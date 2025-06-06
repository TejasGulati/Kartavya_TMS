const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'The user belonging to this token no longer exists.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          status: 'error',
          message: 'Your account has been deactivated. Please contact support.'
        });
      }

      // Grant access to protected route
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.'
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

// Authorization middleware - restrict to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Check if user can manage resource (owner or admin)
exports.checkResourceOwnership = (resourceUserIdField = 'assignedTo') => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const resourceModel = req.baseUrl.includes('tasks') ? 'Task' : 'User';
      
      let resource;
      if (resourceModel === 'Task') {
        const Task = require('../models/Task');
        resource = await Task.findById(id);
      } else {
        resource = await User.findById(id);
      }

      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: `${resourceModel} not found`
        });
      }

      // Admin can access anything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership based on the field
      const resourceUserId = resource[resourceUserIdField]?._id || 
                     resource[resourceUserIdField];
      const canAccess = resourceUserId && resourceUserId.toString() === req.user._id.toString();

      if (!canAccess) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You can only manage your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Authorization check failed'
      });
    }
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token, but we don't fail - just continue without user
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};