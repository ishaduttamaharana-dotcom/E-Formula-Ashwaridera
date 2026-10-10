// ============================================================
//  routes/v1/contactRoutes.js
//  Contact API Routes under /api/v1/contact/*
//  Public GET endpoint + Public Submit POST + protected Admin PUT endpoint.
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const {
  getPublicContactInfo,
  submitContactForm,
} = require('../../controllers/publicContentController');
const { updateContactInfo } = require('../../controllers/contactController');
const { getPublicContactContent } = require('../../controllers/contactPageController');

const router = express.Router();

// ─── Unified Contact Page Content (Public & Preview) ─────────
router.get('/page', getPublicContactContent);

// ─── Public Read Route (Visitors & Users) ───────────────────
router.get('/', (req, res, next) => {
  if (req.query.format === 'legacy' || req.query.type === 'info') {
    return getPublicContactInfo(req, res, next);
  }
  return getPublicContactContent(req, res, next);
});

// ─── Public Contact Form Submission ────────────────────────
// Replaces fake setTimeout timer with real database persistence
router.post('/submit', submitContactForm);
router.post('/submissions', submitContactForm);
router.post('/', submitContactForm);

// ─── Protected Admin Write Route (Admin Only) ────────────────
router.put('/', protect, authorize('admin'), updateContactInfo);

module.exports = router;
