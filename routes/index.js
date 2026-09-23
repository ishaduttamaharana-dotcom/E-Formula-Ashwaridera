// ============================================================
//  routes/index.js
//  Main API router — mounts all v1 sub-routes.
//  All routes follow the /api/v1/* convention.
// ============================================================

const express = require('express');

// ─── Route imports ───────────────────────────────────────────
const healthRoutes       = require('./v1/healthRoutes');
const authRoutes         = require('./v1/authRoutes');
const cmsRoutes          = require('./v1/cmsRoutes');
const contentRoutes      = require('./v1/contentRoutes');
const userRoutes         = require('./v1/userRoutes');
const teamRoutes         = require('./v1/teamRoutes');
const galleryRoutes      = require('./v1/galleryRoutes');
const achievementRoutes  = require('./v1/achievementRoutes');
const contactRoutes      = require('./v1/contactRoutes');
const homeRoutes         = require('./v1/homeRoutes');
const eventRoutes        = require('./v1/eventRoutes');
const sponsorRoutes      = require('./v1/sponsorRoutes');
const joinRoutes         = require('./v1/joinRoutes');
const adminRoutes        = require('./v1/adminRoutes');
const contentTypeRoutes  = require('./v1/contentTypeRoutes');
const contentItemRoutes  = require('./v1/contentItemRoutes');

const router = express.Router();

// ─── Direct Page Endpoints ────────────────────────────────────
const { getPublicCar, getPublicNavFooter } = require('../controllers/publicContentController');
const { getPublicAbout } = require('../controllers/aboutPageController');
router.get('/about', getPublicAbout);
router.get('/car',   getPublicCar);
router.get('/navigation', getPublicNavFooter);
router.get('/navigation-footer', getPublicNavFooter);

// ─── Mount sub-routes ────────────────────────────────────────────
router.use('/health',        healthRoutes);
router.use('/auth',          authRoutes);
router.use('/cms',           cmsRoutes);
router.use('/content',       contentRoutes);
router.use('/users',         userRoutes);
router.use('/team',          teamRoutes);
router.use('/gallery',       galleryRoutes);
router.use('/achievements',  achievementRoutes);
router.use('/contact',       contactRoutes);
router.use('/home',          homeRoutes);
router.use('/events',        eventRoutes);
router.use('/sponsors',      sponsorRoutes);
router.use('/join',          joinRoutes);
router.use('/applications',  joinRoutes);
router.use('/admin',         adminRoutes);
router.use('/content-types', contentTypeRoutes);
router.use('/content-items', contentItemRoutes);

module.exports = router;
