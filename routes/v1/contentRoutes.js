// ============================================================
//  routes/v1/contentRoutes.js
//  Public CMS content retrieval endpoints.
//  Endpoints: /api/v1/content/*
// ============================================================

const express = require('express');
const { getContent } = require('../../controllers/cmsController');
const { getPublicAbout } = require('../../controllers/aboutPageController');
const { getPublicCarContent } = require('../../controllers/carPageController');
const { getPublicGalleryContent } = require('../../controllers/galleryPageController');
const { getPublicSponsorContent } = require('../../controllers/sponsorPageController');
const { getPublicAchievementsContent } = require('../../controllers/achievementsPageController');
const { getPublicContactContent } = require('../../controllers/contactPageController');
const {
  getPublicNavFooter,
  getPublicSeo,
} = require('../../controllers/publicContentController');

const router = express.Router();

// Specific page & shared settings public reads
router.get('/about', getPublicAbout);
router.get('/car', getPublicCarContent);
router.get('/car/page', getPublicCarContent);
router.get('/gallery', getPublicGalleryContent);
router.get('/gallery/page', getPublicGalleryContent);
router.get('/sponsors', getPublicSponsorContent);
router.get('/sponsors/page', getPublicSponsorContent);
router.get('/achievements', getPublicAchievementsContent);
router.get('/achievements/page', getPublicAchievementsContent);
router.get('/contact', getPublicContactContent);
router.get('/contact/page', getPublicContactContent);
router.get('/navigation', getPublicNavFooter);
router.get('/seo', getPublicSeo);

// Generic CMS section retrieval
router.get('/', getContent);
router.get('/:section', getContent);

module.exports = router;
