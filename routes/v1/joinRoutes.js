// ============================================================
//  routes/v1/joinRoutes.js
//  Join Team Application Routes under /api/v1/join/*
// ============================================================

const express = require('express');
const { protect, optionalProtect } = require('../../middleware/authMiddleware');
const { uploadToMemory }   = require('../../config/multer');
const {
  submitApplication,
  getMyApplications,
} = require('../../controllers/joinController');

const router = express.Router();

// ─── Public Submission Routes (Visitors & Logged-In Users) ───
// POST /api/v1/join — Submit application (with optional resume file)
router.post('/', optionalProtect, uploadToMemory('resume'), submitApplication);
router.post('/submit', optionalProtect, uploadToMemory('resume'), submitApplication);

// ─── Protected Logged-In User Routes ─────────────────────────
// GET /api/v1/join/my-applications — Get applications for logged in user
router.get('/my-applications', protect, getMyApplications);

module.exports = router;
