// ============================================================
//  api/[...path].js
//  Vercel Serverless Function catch-all for all /api/* routes.
//  Natively handles /api/v1/auth/login, /api/v1/*, etc.
// ============================================================

require('dotenv').config();
const app = require('../app');

module.exports = (req, res) => {
  // If Vercel stripped '/api' from req.url, restore it so Express router matches
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
};
