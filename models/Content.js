// ============================================================
//  models/Content.js
//  Generic CMS Content Model for site-wide content sections.
//  Powers inline editing for Home, Team, Gallery, Achievements, etc.
// ============================================================

const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: [true, 'Section name is required.'],
      trim: true,
      index: true,
    },

    key: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: '',
    },

    subtitle: {
      type: String,
      trim: true,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    image: {
      url:      { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    buttonText: {
      type: String,
      trim: true,
      default: '',
    },

    buttonLink: {
      type: String,
      trim: true,
      default: '',
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for fast queries by section and key
contentSchema.index({ section: 1, order: 1 });
contentSchema.index({ section: 1, key: 1 });

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
