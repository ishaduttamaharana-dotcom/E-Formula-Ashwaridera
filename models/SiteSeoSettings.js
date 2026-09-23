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
  }
);

const SiteSeoSettings = mongoose.model('SiteSeoSettings', siteSeoSettingsSchema);

module.exports = SiteSeoSettings;
