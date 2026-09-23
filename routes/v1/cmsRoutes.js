// ============================================================
//  routes/v1/cmsRoutes.js
//  CMS API Routes under /api/v1/cms/*
//  Public read-only content endpoints & protected Admin CMS endpoints.
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadToMemory }     = require('../../config/multer');
const {
  getContent,
  createContent,
  updateContent,
  deleteContent,
  uploadImage,
} = require('../../controllers/cmsController');

const router = express.Router();

// ─── Public routes (Visitors & Users) ───────────────────────
// GET /api/v1/cms/content
// GET /api/v1/cms/content/:section
router.get('/content', getContent);
router.get('/content/:section', getContent);

// ─── Admin protected routes (Admin only) ────────────────────
// Require authentication and role === 'admin'
// If user is visitor or role === 'user', returns HTTP 403 Forbidden {"success": false, "message": "Forbidden"}

router.post('/content', protect, authorize('admin'), createContent);
router.put('/content/:id', protect, authorize('admin'), updateContent);
router.delete('/content/:id', protect, authorize('admin'), deleteContent);
router.post('/upload', protect, authorize('admin'), uploadToMemory('image'), uploadImage);

module.exports = router;
