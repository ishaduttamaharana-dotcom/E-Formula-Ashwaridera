// ============================================================
//  utils/logger.js
//  Simple file-based logger for requests and errors.
//  Writes structured log lines to the /logs directory.
// ============================================================

const fs = require('fs');
const path = require('path');

// Resolve the logs directory path
const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Ensure the logs directory exists at startup
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// ─── Log file paths ──────────────────────────────────────────
const ACCESS_LOG_PATH = path.join(LOGS_DIR, 'access.log');
const ERROR_LOG_PATH = path.join(LOGS_DIR, 'error.log');

/**
 * Format a log entry as a structured string.
 *
 * @param {string} level   - Log level (INFO, ERROR, WARN)
 * @param {string} message - Log message
 * @param {object} meta    - Optional additional metadata
 * @returns {string} Formatted log line
 */
const formatLogEntry = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
};

/**
 * Write a log line to a file asynchronously (non-blocking).
 *
 * @param {string} filePath - Absolute path to the log file
 * @param {string} line     - Log line to append
 */
const writeToFile = (filePath, line) => {
  fs.appendFile(filePath, line, (err) => {
    if (err) {
      console.error(`Failed to write to log file: ${filePath}`, err.message);
    }
  });
};

/**
 * Log an HTTP request access entry.
 *
 * @param {string} method     - HTTP method
 * @param {string} url        - Request URL
 * @param {number} statusCode - Response status code
 * @param {number} responseMs - Response time in milliseconds
 */
const logAccess = (method, url, statusCode, responseMs) => {
  const line = formatLogEntry('INFO', `${method} ${url} ${statusCode} ${responseMs}ms`);
  writeToFile(ACCESS_LOG_PATH, line);
};

/**
 * Log an application error.
 *
 * @param {string} message - Error message
 * @param {object} meta    - Optional metadata (e.g. stack, route)
 */
const logError = (message, meta = {}) => {
  const line = formatLogEntry('ERROR', message, meta);
  writeToFile(ERROR_LOG_PATH, line);
};

/**
 * Log a warning.
 *
 * @param {string} message - Warning message
 * @param {object} meta    - Optional metadata
 */
const logWarn = (message, meta = {}) => {
  const line = formatLogEntry('WARN', message, meta);
  writeToFile(ERROR_LOG_PATH, line);
};

/**
 * Morgan stream adapter — pipes Morgan HTTP logs into the access log file.
 * Usage: morgan('combined', { stream: morganStream })
 */
const morganStream = {
  write: (message) => {
    writeToFile(ACCESS_LOG_PATH, message);
  },
};

module.exports = { logAccess, logError, logWarn, morganStream };
