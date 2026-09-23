// ============================================================
//  routes/v1/sponsorRoutes.js
//  Sponsor API Routes under /api/v1/sponsors/*
// ============================================================

const express = require('express');
const { protect, optionalProtect } = require('../../middleware/authMiddleware');
const { uploadToMemoryFields } = require('../../config/multer');
const {
  getPublicSponsorContent,
  submitPublicSponsorEnquiry,
} = require('../../controllers/sponsorPageController');
const {
  submitSponsorRequest,
  getMySponsorRequests,
} = require('../../controllers/sponsorController');

const router = express.Router();

// ─── Public Read Routes (Unified Sponsor Page Content) ─────────
router.get('/', getPublicSponsorContent);
router.get('/public', getPublicSponsorContent);

// ─── Public Form Submission (Direct to Inbox) ────────────────
router.post('/enquiry', submitPublicSponsorEnquiry);

// ─── Public Submission Route with Optional Uploads ────────────
router.post(
  '/',
  optionalProtect,
  uploadToMemoryFields([
    { name: 'logo', maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ]),
  submitSponsorRequest
);

router.post(
  '/submit',
  optionalProtect,
  uploadToMemoryFields([
    { name: 'logo', maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ]),
  submitSponsorRequest
);

router.get('/my-request', protect, getMySponsorRequests);

module.exports = router;
