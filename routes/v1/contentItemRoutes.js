// ============================================================
//  routes/v1/contentItemRoutes.js
// ============================================================

const express = require('express');
const router = express.Router();
const contentItemController = require('../../controllers/contentItemController');
const globalSearchController = require('../../controllers/globalSearchController');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Global Cross-Content-Type Search
router.get('/admin/global-search', protect, authorize('admin'), globalSearchController.globalSearch);

// Public Content Items Endpoint
router.get('/public/:contentType', contentItemController.getPublicContentItems);

// Admin Content Items Endpoints
router.get('/admin/:contentType', protect, authorize('admin'), contentItemController.getAdminContentItems);
router.get('/admin/:contentType/:id', protect, authorize('admin'), contentItemController.getContentItemById);
router.post('/admin/:contentType', protect, authorize('admin'), contentItemController.createContentItem);
router.put('/admin/:contentType/:id', protect, authorize('admin'), contentItemController.updateContentItem);
router.post('/admin/:contentType/:id/duplicate', protect, authorize('admin'), contentItemController.duplicateContentItem);
router.delete('/admin/:contentType/:id', protect, authorize('admin'), contentItemController.deleteContentItem);
router.post('/admin/:contentType/bulk', protect, authorize('admin'), contentItemController.bulkContentItemAction);

module.exports = router;
