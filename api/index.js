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
    const isPublicOrStatic =
      req.url.startsWith('/admin') ||
      req.url.startsWith('/public') ||
      req.url.startsWith('/uploads') ||
      /\.(html|css|js|png|jpg|jpeg|gif|svg|ico|webp|json|woff2?|ttf|eot)$/i.test(req.url.split('?')[0]) ||
      /^\/(about|car|team|gallery|sponsors|contact|achievements|my-applications)?(\.html)?($|\?)/i.test(req.url);

    if (!req.url.startsWith('/api') && !isPublicOrStatic) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    // Also fix req.path for Express routing
    if (req.path && !req.path.startsWith('/api') && !isPublicOrStatic) {
      Object.defineProperty(req, 'path', {
        value: '/api' + (req.path.startsWith('/') ? req.path : '/' + req.path),
        writable: true,
        configurable: true,
      });
    }
  }
  return app(req, res);
};
