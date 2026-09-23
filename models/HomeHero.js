// ============================================================
//  models/HomeHero.js
//  Mongoose Schema for Home Page Hero Section (home_hero collection)
// ============================================================

const mongoose = require('mongoose');

const homeHeroSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      default: 'Ashwa Riders — 2026 Season',
    },

    heading: {
      type: String,
      default: 'ASHWA RIDERS',
    },

    subtitle: {
      type: String,
      default: 'Engineering Speed. Building Innovation. Racing the Future.',
    },

    videoUrl: {
      type: String,
      default: 'https://res.cloudinary.com/frjck4sc/video/upload/v1784445874/vidssave.com_This_is_FORMULA_1_1080P_ex9dby.mp4',
    },

    publicId: {
      type: String,
      default: '',
    },

    primaryBtnText: {
      type: String,
      default: 'Explore Our Car',
    },

    primaryBtnLink: {
      type: String,
      default: 'car.html',
    },

    secondaryBtnText: {
      type: String,
      default: 'Become a Sponsor',
    },

    secondaryBtnLink: {
      type: String,
      default: 'sponsors.html',
    },
  },
  {
    collection: 'home_hero',
    timestamps: true,
    versionKey: false,
  }
);

const HomeHero = mongoose.model('HomeHero', homeHeroSchema);

module.exports = HomeHero;
