// ============================================================
//  api/index.js
//  Vercel Serverless Function entry point.
//  Exports a serverless handler for the Express application.
// ============================================================

require('dotenv').config();

const app = require('../app');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
  try {
    // Ensure MongoDB connection is established / reused from pool
    await connectDB();
  } catch (err) {
    console.error('Database connection error in serverless handler:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please try again shortly.',
    });
  }

  // Delegate request to Express app
  return app(req, res);
};
