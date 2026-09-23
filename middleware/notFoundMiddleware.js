// ============================================================
//  middleware/notFoundMiddleware.js
//  Catches requests to routes that do not exist.
//  Must be registered AFTER all routes in app.js.
// ============================================================

/**
 * 404 Not Found middleware.
 * Any request that reaches this handler did not match a registered route.
 *
 * @param {Request}  req  - Express request
 * @param {Response} res  - Express response
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found — ${req.method} ${req.originalUrl}`,
  });
};

module.exports = notFound;
