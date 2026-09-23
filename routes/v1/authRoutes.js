// ============================================================
//  routes/v1/authRoutes.js
//  All authentication endpoints under /api/v1/auth/*
// ============================================================

const express      = require('express');
const rateLimit    = require('express-rate-limit');

const {
  register,
  login,
  logout,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
} = require('../../controllers/authController');

const { protect } = require('../../middleware/authMiddleware');

const {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
  handleValidation,
} = require('../../validators/authValidator');

const router = express.Router();

// ─── Auth-specific rate limiter (stricter than global) ───────
// Applies only to login to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max:      10,              // Max 10 login attempts per IP per window
  standardHeaders: true,
  legacyHeaders:   false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// ─── Public routes ───────────────────────────────────────────

// POST /api/v1/auth/register
router.post(
  '/register',
  validateRegister,
  handleValidation,
  register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  authLimiter,
  validateLogin,
  handleValidation,
  login
);

// ─── Protected routes (require valid JWT cookie) ─────────────

// POST /api/v1/auth/logout
router.post('/logout', protect, logout);

// GET /api/v1/auth/me
router.get('/me', protect, getMe);

// GET /api/v1/auth/profile
router.get('/profile', protect, getProfile);

// PUT /api/v1/auth/profile
router.put(
  '/profile',
  protect,
  validateUpdateProfile,
  handleValidation,
  updateProfile
);

// PUT /api/v1/auth/change-password
router.put(
  '/change-password',
  protect,
  validateChangePassword,
  handleValidation,
  changePassword
);

module.exports = router;
