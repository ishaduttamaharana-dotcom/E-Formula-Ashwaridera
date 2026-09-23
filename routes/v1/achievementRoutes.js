// ============================================================
//  routes/v1/achievementRoutes.js
//  Achievements API Routes under /api/v1/achievements/*
//  Public read endpoint + protected Admin write endpoints.
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { getPublicAchievements } = require('../../controllers/publicContentController');
const {
  createAchievement,
  updateAchievement,
  deleteAchievement,
} = require('../../controllers/achievementController');
const { getPublicAchievementsContent } = require('../../controllers/achievementsPageController');

const router = express.Router();

// ─── Public Read Routes ──────────────────────────────────────
router.get('/page', getPublicAchievementsContent);
router.get('/', getPublicAchievements);

// ─── Protected Admin Write Routes ────────────────────────────
router.post('/', protect, authorize('admin'), createAchievement);
router.put('/:id', protect, authorize('admin'), updateAchievement);
router.delete('/:id', protect, authorize('admin'), deleteAchievement);

module.exports = router;
