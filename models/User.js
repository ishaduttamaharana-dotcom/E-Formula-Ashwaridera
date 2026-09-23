// ============================================================
//  models/User.js
//  Mongoose schema for all users (including admin role).
//  Passwords are NEVER stored in plain text.
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const SALT_ROUNDS = 12;

// ─── Password strength regex ─────────────────────────────────
// Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#\-_+=])[A-Za-z\d@$!%*?&^#\-_+=]{8,}$/;

// ─── Schema ──────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters.'],
      maxlength: [100, 'Full name must not exceed 100 characters.'],
    },

    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-().]{7,20}$/, 'Please enter a valid phone number.'],
    },

    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false, // Never return password by default
    },

    college: {
      type: String,
      trim: true,
      maxlength: [150, 'College name must not exceed 150 characters.'],
    },

    branch: {
      type: String,
      trim: true,
      maxlength: [100, 'Branch must not exceed 100 characters.'],
    },

    profilePhoto: {
      url:       { type: String, default: null },
      publicId:  { type: String, default: null }, // Cloudinary public ID for deletion
    },

    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin".',
      },
      default: 'user',
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────
// Note: email index is already created by unique:true in the field definition
userSchema.index({ role: 1 });

// ─── Pre-save hook: Hash password ────────────────────────────
// Mongoose 8+: async pre-save hooks resolve via the returned Promise — no next() needed
userSchema.pre('save', async function () {
  // Only rehash if the password field has been modified
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// ─── Instance method: Compare passwords ──────────────────────
/**
 * Compares a plain-text candidate password to the stored hash.
 * @param {string} candidatePassword - Plain-text password from login form
 * @returns {Promise<boolean>} true if match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── toJSON transform: Strip sensitive fields ────────────────
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// ─── Export ──────────────────────────────────────────────────
const User = mongoose.model('User', userSchema);

module.exports = User;
