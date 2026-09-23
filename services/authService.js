// ============================================================
//  services/authService.js
//  Authentication-related service helpers.
//  seedAdmin() — idempotent first-admin creation from .env
// ============================================================

const User = require('../models/User');

/**
 * Seeds the first admin account from environment variables.
 * Safe to call on every startup — does nothing if an admin already exists.
 * Credentials are read exclusively from process.env — never hardcoded.
 */
const seedAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    // Validate that all required env vars are present
    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.warn('⚠️   Admin seed skipped: ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD is missing from .env');
      return;
    }

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log(`✅  Admin account already exists: ${existingAdmin.email}`);
      return;
    }

    // Create the admin — password will be hashed by the pre-save hook
    const admin = await User.create({
      fullName:   ADMIN_NAME,
      email:      ADMIN_EMAIL.toLowerCase().trim(),
      password:   ADMIN_PASSWORD,
      role:       'admin',
      isVerified: true,
      isActive:   true,
      college:    'Ashwa Riders Admin',
      branch:     'Administration',
    });

    console.log(`🔑  Admin account seeded successfully: ${admin.email}`);
  } catch (error) {
    // Log but do not crash the server for a seed failure
    console.error(`❌  Admin seed failed: ${error.message}`);
  }
};

module.exports = { seedAdmin };
