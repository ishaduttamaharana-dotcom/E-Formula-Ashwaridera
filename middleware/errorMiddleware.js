// ============================================================
//  middleware/errorMiddleware.js
//  Global error handling middleware.
//  Must be registered LAST in app.js (after all routes).
// ============================================================

/**
 * Global error handler.
 * Catches errors thrown/passed via next(err) from any route or middleware.
 * Formats all errors as consistent JSON.
 * Hides stack traces in production.
 *
 * @param {Error}    err  - The error object
 * @param {Request}  req  - Express request
 * @param {Response} res  - Express response
 * @param {Function} next - Express next (required signature for error middleware)
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code — default to 500 if not set on the error
  const statusCode = err.statusCode || err.status || 500;

  let message = err.message || 'An unexpected server error occurred.';
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File upload exceeds the allowed limit (Maximum 1000MB).',
      code: 'LIMIT_FILE_SIZE',
    });
  }
  if (statusCode === 413 || err.type === 'entity.too.large') {
    message = 'Publish payload is too large. Media files must be uploaded separately and only their URLs should be included in the content.';
  }

  // Build the error response body
  const response = {
    success: false,
    message,
    // Include error code if provided (e.g. 'VALIDATION_ERROR')
    ...(err.code && { code: err.code }),
    // Include field-level validation errors if present
    ...(err.errors && { errors: err.errors }),
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Log the full error server-side regardless of environment
  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${statusCode}: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
