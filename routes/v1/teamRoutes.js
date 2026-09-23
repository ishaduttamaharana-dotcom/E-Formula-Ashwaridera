// ============================================================
//  routes/v1/teamRoutes.js
//  Team Members API Routes under /api/v1/team/*
//  Public read endpoint + protected Admin write endpoints.
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { getPublicTeamContent } = require('../../controllers/teamPageController');
const {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../../controllers/teamController');

const router = express.Router();

// ─── Public Read Route (Visitors & Users) ───────────────────
router.get('/', getPublicTeamContent);

// ─── Protected Admin Write Routes (Admin Only) ───────────────
router.post('/', protect, authorize('admin'), createTeamMember);
router.put('/:id', protect, authorize('admin'), updateTeamMember);
router.delete('/:id', protect, authorize('admin'), deleteTeamMember);

module.exports = router;
