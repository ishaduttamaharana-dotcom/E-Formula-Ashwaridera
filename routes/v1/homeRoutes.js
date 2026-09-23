// ============================================================
//  routes/v1/homeRoutes.js
//  Home Page Public Read & Compatibility API routes under /api/v1/home/*
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadToMemory } = require('../../config/multer');
const {
  getPublicHero,
  getPublicHomepageCombined,
  getPublicBuildStages,
  getPublicNews,
  getPublicStats,
  getPublicSponsors,
} = require('../../controllers/publicContentController');
const { getPublicHome } = require('../../controllers/homePageController');

const {
  updateHero, uploadHeroVideo,
  createGarageCard, updateGarageCard, deleteGarageCard,
  createNewsCard, updateNewsCard, deleteNewsCard,
  createStat, updateStat, deleteStat,
  createSponsor, updateSponsor, deleteSponsor,
} = require('../../controllers/homeCmsController');

const router = express.Router();

// ─── Public Read Routes (Visitors & Users) ───────────────────
router.get('/',         getPublicHome);
router.get('/hero',     getPublicHero);
router.get('/garage',   getPublicBuildStages);
router.get('/news',     getPublicNews);
router.get('/stats',    getPublicStats);
router.get('/sponsors', getPublicSponsors);

// ─── Legacy/Compatibility Admin Write Routes ────────────────
router.put('/hero',          protect, authorize('admin'), updateHero);
router.post('/hero/video',   protect, authorize('admin'), uploadToMemory('video'), uploadHeroVideo);

router.post('/garage',       protect, authorize('admin'), createGarageCard);
router.put('/garage/:id',    protect, authorize('admin'), updateGarageCard);
router.delete('/garage/:id', protect, authorize('admin'), deleteGarageCard);

router.post('/news',         protect, authorize('admin'), createNewsCard);
router.put('/news/:id',      protect, authorize('admin'), updateNewsCard);
router.delete('/news/:id',   protect, authorize('admin'), deleteNewsCard);

router.post('/stats',        protect, authorize('admin'), createStat);
router.put('/stats/:id',     protect, authorize('admin'), updateStat);
router.delete('/stats/:id',  protect, authorize('admin'), deleteStat);

router.post('/sponsors',     protect, authorize('admin'), createSponsor);
router.put('/sponsors/:id',  protect, authorize('admin'), updateSponsor);
router.delete('/sponsors/:id', protect, authorize('admin'), deleteSponsor);

module.exports = router;
