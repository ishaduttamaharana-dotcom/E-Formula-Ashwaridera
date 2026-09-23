// ============================================================
//  middleware/authMiddleware.js
//  JWT-based authentication + role-based authorization.
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ─── Cookie name constant ────────────────────────────────────
const COOKIE_NAME = 'token';

/**
 * protect — verifies JWT and attaches the full user to req.user.
 *
 * Token is read from (priority order):
 *   1. httpOnly cookie named "token"
 *   2. Authorization: Bearer <token> header
 *
 * Rejects with 401 if:
 *   - No token provided
 *   - Token is invalid or malformed
 *   - Token has expired
 *   - User no longer exists in DB
 *   - User account is deactivated
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Prefer httpOnly cookie (most secure)
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }
    // 2. Fallback: Authorization header (for API clients / Postman)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please log in to continue.',
      });
    }

    // Verify signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token. Please log in again.',
      });
    }

    // Fetch full user from DB (ensures user still exists and is active)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Attach full user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authentication failed.',
    });
  }
};

/**
 * authorize — role-based access control factory.
 * Must be used AFTER protect middleware.
 *
 * @param {...string} roles - Allowed roles (e.g. 'admin', 'user')
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.delete('/user/:id', protect, authorize('admin'), handler);
 *   router.get('/profile',     protect, authorize('user', 'admin'), handler);
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please log in to continue.',
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    });
  }

  next();
};

/**
 * optionalProtect — checks for JWT authentication but does NOT reject if absent.
 * If a valid token is present, req.user is set. If not, req.user is set to null.
 * Perfect for public endpoints that accept stranger submissions but attach user profile if logged in.
 */
const optionalProtect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

module.exports = { protect, optionalProtect, authorize };
