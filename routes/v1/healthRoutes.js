// ============================================================
//  routes/v1/healthRoutes.js
//  Health check endpoint — confirms server + DB status.
// ============================================================

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Health check — returns server and database status
 * @access  Public
 */
const { getDatabaseDiagnostic } = require('../../config/db');

router.get('/', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const diag = getDatabaseDiagnostic();
  const statusCode = isConnected ? 200 : 503;

  return res.status(statusCode).json({
    success: isConnected,
    message: isConnected ? 'Backend is running' : 'Backend is running but database is unreachable',
    diagnostic: {
      MONGODB_URI_PRESENT: diag.MONGODB_URI_PRESENT,
      DATABASE_NAME_PRESENT: diag.DATABASE_NAME_PRESENT,
      CONNECTION_STATE: diag.CONNECTION_STATE,
      CONNECTION_ERROR_CATEGORY: isConnected ? 'NONE' : (diag.MONGODB_URI_PRESENT ? 'DISCONNECTED' : 'MISSING_ENV'),
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
