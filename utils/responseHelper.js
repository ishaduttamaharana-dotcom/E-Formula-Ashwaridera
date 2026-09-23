// ============================================================
//  utils/responseHelper.js
//  Standardized API response helpers.
//  Use these in all controllers to ensure consistent JSON shape.
// ============================================================

/**
 * Send a successful response.
 *
 * @param {Response} res        - Express response object
 * @param {number}   statusCode - HTTP status code (default 200)
 * @param {string}   message    - Human-readable success message
 * @param {*}        data       - Response payload (optional)
 * @param {object}   meta       - Pagination or extra metadata (optional)
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 *
 * @param {Response} res        - Express response object
 * @param {number}   statusCode - HTTP status code (default 500)
 * @param {string}   message    - Human-readable error message
 * @param {object}   errors     - Field-level validation errors (optional)
 */
const sendError = (res, statusCode = 500, message = 'An error occurred.', errors = null) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated list response.
 *
 * @param {Response} res        - Express response object
 * @param {string}   message    - Human-readable message
 * @param {Array}    data       - Array of results
 * @param {number}   page       - Current page number
 * @param {number}   limit      - Items per page
 * @param {number}   total      - Total number of items
 */
const sendPaginated = (res, message = 'Success', data = [], page = 1, limit = 10, total = 0) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
