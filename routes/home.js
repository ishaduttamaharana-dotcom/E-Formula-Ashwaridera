// routes/home.js
const express = require('express');
const router = express.Router();
const homeData = require('../data/homeData');

// GET /api/home/stats
router.get('/stats', (req, res) => {
  res.json({ success: true, data: homeData.stats });
});

// GET /api/home/news
router.get('/news', (req, res) => {
  res.json({ success: true, data: homeData.news });
});

// GET /api/home/team
router.get('/team', (req, res) => {
  res.json({ success: true, data: homeData.teamPreview });
});

// GET /api/home/sponsors
router.get('/sponsors', (req, res) => {
  res.json({ success: true, data: homeData.sponsors });
});

// GET /api/home/achievements
router.get('/achievements', (req, res) => {
  res.json({ success: true, data: homeData.achievements });
});

// GET /api/home/events
router.get('/events', (req, res) => {
  res.json({ success: true, data: homeData.events });
});

// GET /api/home/testimonials
router.get('/testimonials', (req, res) => {
  res.json({ success: true, data: homeData.testimonials });
});

// GET /api/home/partners
router.get('/partners', (req, res) => {
  res.json({ success: true, data: homeData.partners });
});

// Optional: get all home data in one request
router.get('/all', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: homeData.stats,
      news: homeData.news,
      team: homeData.teamPreview,
      sponsors: homeData.sponsors,
      achievements: homeData.achievements,
      events: homeData.events,
      testimonials: homeData.testimonials,
      partners: homeData.partners,
    }
  });
});

module.exports = router;