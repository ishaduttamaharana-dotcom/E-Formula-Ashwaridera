// ============================================================
//  api/index.js
//  Vercel Serverless Function entry point.
//  Exports the Express application for the native Vercel Node runtime.
//  Handles url rewriting to ensure Express routes match correctly.
// ============================================================

require('dotenv').config();
const app = require('../app');

module.exports = (req, res) => {
  // Vercel can strip the '/api' prefix when routing to this function.
  // Ensure Express always sees the full path starting with /api.
  if (req.url) {
    const isStaticOrAdmin = req.url.startsWith('/admin') || req.url.startsWith('/public');
    if (!req.url.startsWith('/api') && !isStaticOrAdmin) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    // Also fix req.path for Express routing
    if (req.path && !req.path.startsWith('/api') && !isStaticOrAdmin) {
      Object.defineProperty(req, 'path', {
        value: '/api' + (req.path.startsWith('/') ? req.path : '/' + req.path),
        writable: true,
        configurable: true,
      });
    }
  }
  return app(req, res);
};
