// ============================================================
//  routes/v1/galleryRoutes.js
//  Gallery API Routes under /api/v1/gallery/*
//  Public read endpoints + protected Admin write endpoints.
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { getPublicGalleryContent } = require('../../controllers/galleryPageController');
const {
  getAlbums, createAlbum, updateAlbum, deleteAlbum,
  getImages, createImage, updateImage, replaceImage, deleteImage,
} = require('../../controllers/galleryController');

const router = express.Router();

// ─── Public Read Routes (Visitors & Users) ───────────────────
router.get('/',               getPublicGalleryContent);
router.get('/albums',          getAlbums);
router.get('/images',          getImages);
router.get('/images/:albumId', getImages);

// ─── Protected Admin Write Routes (Admin Only) ───────────────
router.post('/albums',       protect, authorize('admin'), createAlbum);
router.put('/albums/:id',    protect, authorize('admin'), updateAlbum);
router.delete('/albums/:id', protect, authorize('admin'), deleteAlbum);

router.post('/images',            protect, authorize('admin'), createImage);
router.put('/images/:id',         protect, authorize('admin'), updateImage);
router.put('/images/:id/replace', protect, authorize('admin'), replaceImage);
router.delete('/images/:id',      protect, authorize('admin'), deleteImage);

module.exports = router;
