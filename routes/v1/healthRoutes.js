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
router.get('/', (req, res) => {
  // mongoose.connection.readyState:
  //   0 = disconnected | 1 = connected | 2 = connecting | 3 = disconnecting
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === 1;

  const statusCode = isConnected ? 200 : 503;

  return res.status(statusCode).json({
    success: isConnected,
    message: isConnected ? 'Backend is running' : 'Backend is running but database is unreachable',
    database: isConnected ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
