// ============================================================
//  models/CmsContent.js
//  Generic CMS Content Model mapped to 'cms_contents' collection.
//  Powers inline editing across all website sections.
// ============================================================

const mongoose = require('mongoose');

const cmsContentSchema = new mongoose.Schema(
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

    description: {
      type: String,
      trim: true,
      default: '',
    },

    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },

    publicId: {
      type: String,
      trim: true,
      default: '',
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
    collection: 'cms_contents', // Explicitly map to cms_contents collection
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for performant querying
cmsContentSchema.index({ section: 1, order: 1 });
cmsContentSchema.index({ section: 1, key: 1 });

const CmsContent = mongoose.model('CmsContent', cmsContentSchema);

module.exports = CmsContent;
