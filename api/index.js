// ============================================================
//  api/index.js
//  Vercel Serverless Function entry point.
//  Exports the Express application for the native Vercel Node runtime.
// ============================================================

require('dotenv').config();
const app = require('../app');

module.exports = app;
