// ============================================================
//  routes/v1/contentTypeRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const contentTypeController = require('../../controllers/contentTypeController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Public
router.get('/', contentTypeController.getContentTypes);
router.get('/:slug', contentTypeController.getContentTypeBySlug);

// Protected Admin Routes
router.post('/admin', protect, authorize('admin'), contentTypeController.createContentType);
router.put('/admin/:slug', protect, authorize('admin'), contentTypeController.updateContentType);
router.delete('/admin/:slug', protect, authorize('admin'), contentTypeController.deleteContentType);

module.exports = router;
