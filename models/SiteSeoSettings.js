// ============================================================
//  models/SiteSeoSettings.js
//  Mongoose Schema for Site Identity & Per-Page SEO Settings.
// ============================================================

const mongoose = require('mongoose');

const siteSeoSettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'Ashwa Riders — Formula Student EV Team',
    },
    defaultOgImage: {
      type: String,
      default: '',
    },
    faviconUrl: {
      type: String,
      default: '/logo.png.png',
    },
    defaultTitle: {
      type: String,
      default: 'E-Formula Ashwa Riders | Formula Student Electric Racing Team',
    },
    defaultDescription: {
      type: String,
      default: "Official website of E-Formula Ashwa Riders, Central India's premier Formula Student Electric racing team representing SVPCET Nagpur. Discover our car, team, and innovations.",
    },
    canonicalUrl: {
      type: String,
      default: 'https://www.e-formulaashwariders.in',
    },
    homeTitle: { type: String, default: '' },
    homeDescription: { type: String, default: '' },
    aboutTitle: { type: String, default: '' },
    aboutDescription: { type: String, default: '' },
    carTitle: { type: String, default: '' },
    carDescription: { type: String, default: '' },
    teamTitle: { type: String, default: '' },
    teamDescription: { type: String, default: '' },
    achievementsTitle: { type: String, default: '' },
    achievementsDescription: { type: String, default: '' },
    galleryTitle: { type: String, default: '' },
    galleryDescription: { type: String, default: '' },
    sponsorsTitle: { type: String, default: '' },
    sponsorsDescription: { type: String, default: '' },
    contactTitle: { type: String, default: '' },
    contactDescription: { type: String, default: '' },
    pagesSeo: [
      {
        pageKey: { type: String, required: true }, // e.g. 'home', 'about', 'car', 'team', 'achievements', 'gallery', 'sponsors', 'contact'
        title: { type: String, required: true },
        description: { type: String, required: true },
        canonicalUrl: { type: String, default: '' },
        ogImage: { type: String, default: '' },
      },
    ],
    // Lifecycle & Publishing fields
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    collection: 'site_seo_settings',
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

const SiteSeoSettings = mongoose.model('SiteSeoSettings', siteSeoSettingsSchema);

module.exports = SiteSeoSettings;
