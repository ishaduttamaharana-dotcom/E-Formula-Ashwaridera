// ============================================================
//  utils/jwtHelper.js
//  JWT token generation and verification helpers.
//  Actual token issuance will be wired up during the Auth phase.
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token.
 *
 * @param {object} payload   - Data to encode inside the token (e.g. { id, role })
 * @param {string} expiresIn - Token lifetime (default from env, e.g. '7d')
 * @returns {string} Signed JWT token string
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT token.
 *
 * @param {string} token - JWT token string to verify
 * @returns {object} Decoded payload if valid
 * @throws {JsonWebTokenError | TokenExpiredError} If the token is invalid or expired
 */
const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }

  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Decode a JWT token WITHOUT verifying the signature.
 * Useful for extracting info from expired tokens (e.g. refresh flows).
 *
 * @param {string} token - JWT token string
 * @returns {object | null} Decoded payload or null
 */
const decodeToken = (token) => jwt.decode(token);

module.exports = { generateToken, verifyToken, decodeToken };
