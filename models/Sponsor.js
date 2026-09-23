// ============================================================
//  models/Sponsor.js
//  Consolidated Mongoose Schema for Corporate Sponsors.
// ============================================================

const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sponsor company name is required.'],
      trim: true,
    },
    tier: {
      type: String,
      enum: ['Title', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Associate', 'Technical Partner', 'Equipment Partner'],
      default: 'Gold',
      required: true,
      index: true,
    },
    logoUrl: {
      type: String,
      required: [true, 'Logo URL is required.'],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: '',
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: 'fas fa-award',
      trim: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: true,
    },
    // Lifecycle & Publishing fields
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
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
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    collection: 'sponsors',
    timestamps: true,
    versionKey: false,
  }
);

sponsorSchema.index({ order: 1, tier: 1 });

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

module.exports = Sponsor;
