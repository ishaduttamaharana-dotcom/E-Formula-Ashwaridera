// ============================================================
//  middleware/adminMiddleware.js
//  Admin role verification middleware scaffold.
//  Must be used AFTER the protect middleware.
//  Full implementation will be added in the Admin phase.
// ============================================================

/**
 * Restricts access to admin users only.
 * Assumes req.user is already populated by the protect middleware.
 *
 * Usage (Phase 2+):
 *   router.delete('/user/:id', protect, adminOnly, adminController.deleteUser);
 *
 * @param {Request}  req  - Express request
 * @param {Response} res  - Express response
 * @param {Function} next - Express next
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. You must be logged in.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

/**
 * Restricts access to super-admin users only.
 * Assumes req.user is already populated by the protect middleware.
 *
 * @param {Request}  req  - Express request
 * @param {Response} res  - Express response
 * @param {Function} next - Express next
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. You must be logged in.',
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super-admin privileges required.',
    });
  }

  next();
};

module.exports = { adminOnly, superAdminOnly };
