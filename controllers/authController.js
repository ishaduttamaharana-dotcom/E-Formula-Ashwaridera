// ============================================================
//  controllers/authController.js
//  Handles all authentication logic.
//  All functions are async and use the global error handler via next().
// ============================================================

const User                  = require('../models/User');
const { generateToken }     = require('../utils/jwtHelper');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ─── Cookie options ──────────────────────────────────────────
const getCookieOptions = () => ({
  httpOnly: true,                                          // Inaccessible to client-side JS
  secure:   process.env.NODE_ENV === 'production',        // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,                     // 7 days in ms
  path:     '/',
});

// ─── Safe user object (no password, no internal fields) ──────
const safeUser = (user) => ({
  _id:          user._id,
  fullName:     user.fullName,
  email:        user.email,
  phone:        user.phone,
  college:      user.college,
  branch:       user.branch,
  profilePhoto: user.profilePhoto,
  role:         user.role,
  isVerified:   user.isVerified,
  isActive:     user.isActive,
  createdAt:    user.createdAt,
  updatedAt:    user.updatedAt,
});

// ============================================================
//  POST /api/v1/auth/register
// ============================================================
const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, college, branch } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return sendError(res, 409, 'An account with this email already exists.');
    }

    // Create user — password is hashed by the pre-save hook in User model
    const user = await User.create({
      fullName: fullName.trim(),
      email:    email.toLowerCase().trim(),
      phone:    phone?.trim(),
      password,
      college:  college?.trim(),
      branch:   branch?.trim(),
    });

    // Generate JWT token
    const token = generateToken({ id: user._id, role: user.role });

    // Set secure httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    return sendSuccess(res, 201, 'Account created successfully. Welcome to Ashwa Riders!', {
      user: safeUser(user),
    });
  } catch (error) {
    // MongoDB duplicate key error (race condition safety net)
    if (error.code === 11000) {
      return sendError(res, 409, 'An account with this email already exists.');
    }
    next(error);
  }
};

// ============================================================
//  POST /api/v1/auth/login
// ============================================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user — explicitly include password field (select: false in schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      // Generic message — don't reveal which field is wrong
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Check account status
    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Please contact support.');
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Generate JWT token
    const token = generateToken({ id: user._id, role: user.role });

    // Set secure httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    return sendSuccess(res, 200, 'Login successful.', {
      user: safeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  POST /api/v1/auth/logout
// ============================================================
const logout = async (req, res, next) => {
  try {
    // Clear the auth cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires:  new Date(0), // Expire immediately
      path:     '/',
    });

    return sendSuccess(res, 200, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  GET /api/v1/auth/me
//  Returns lightweight user info (from protect middleware)
// ============================================================
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'Authenticated user retrieved.', {
      user: safeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  GET /api/v1/auth/profile
//  Returns full user profile fetched fresh from DB
// ============================================================
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, 'Profile retrieved successfully.', {
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  PUT /api/v1/auth/profile
//  Update allowed profile fields only
// ============================================================
const updateProfile = async (req, res, next) => {
  try {
    // Whitelist of fields the user is allowed to update
    const allowed = ['fullName', 'phone', 'college', 'branch'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field];
      }
    });

    // Handle profile photo URL if provided (Cloudinary URL)
    if (req.body.profilePhotoUrl) {
      updates['profilePhoto.url']      = req.body.profilePhotoUrl;
      updates['profilePhoto.publicId'] = req.body.profilePhotoPublicId || null;
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields provided for update.');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, 'Profile updated successfully.', {
      user: safeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  PUT /api/v1/auth/change-password
// ============================================================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 401, 'Current password is incorrect.');
    }

    // Prevent reuse of the same password
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return sendError(res, 400, 'New password must be different from your current password.');
    }

    // Assign new password — pre-save hook will hash it
    user.password = newPassword;
    await user.save();

    // Rotate the auth cookie with a fresh token
    const token = generateToken({ id: user._id, role: user.role });
    res.cookie('token', token, getCookieOptions());

    return sendSuccess(res, 200, 'Password changed successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
};
