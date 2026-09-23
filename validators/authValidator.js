// ============================================================
//  validators/authValidator.js
//  Express-Validator chains for all authentication operations.
//  Import individual arrays into route definitions.
// ============================================================

const { body, validationResult } = require('express-validator');

// ─── Password strength rule (reusable) ───────────────────────
const passwordStrength = (field = 'password') =>
  body(field)
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/\d/).withMessage('Password must contain at least one number.')
    .matches(/[@$!%*?&^#\-_+=]/).withMessage('Password must contain at least one special character (@$!%*?&^#-_+=).');

// ─── Register ────────────────────────────────────────────────
const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Please enter a valid phone number.'),

  passwordStrength('password'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),

  body('college')
    .trim()
    .notEmpty().withMessage('College name is required.')
    .isLength({ max: 150 }).withMessage('College name must not exceed 150 characters.'),

  body('branch')
    .trim()
    .notEmpty().withMessage('Branch is required.')
    .isLength({ max: 100 }).withMessage('Branch must not exceed 100 characters.'),
];

// ─── Login ───────────────────────────────────────────────────
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ─── Change Password ─────────────────────────────────────────
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),

  passwordStrength('newPassword'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your new password.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

// ─── Update Profile ──────────────────────────────────────────
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters.'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Please enter a valid phone number.'),

  body('college')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('College name must not exceed 150 characters.'),

  body('branch')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Branch must not exceed 100 characters.'),

  // Explicitly block role change attempts
  body('role')
    .not().exists().withMessage('You are not allowed to change your role.'),

  body('isActive')
    .not().exists().withMessage('You are not allowed to change account status.'),
];

// ─── Validation result middleware ────────────────────────────
/**
 * Reads express-validator results. If any errors exist,
 * returns a 422 with a structured errors array and stops the chain.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field:   e.path || e.param,
      message: e.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please fix the errors below.',
      errors:  formatted,
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateUpdateProfile,
  handleValidation,
};
