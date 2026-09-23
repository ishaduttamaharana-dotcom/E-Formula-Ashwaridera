// ============================================================
//  models/SponsorPackage.js
//  Mongoose Schema for Sponsorship Tier Packages (Title/Platinum/Gold/Silver/Bronze).
// ============================================================

const mongoose = require('mongoose');

const sponsorPackageSchema = new mongoose.Schema(
  {
    tierName: {
      type: String,
      required: [true, 'Tier name is required.'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Package title is required.'],
      trim: true,
    },
    valueRange: {
      type: String,
      default: '',
      trim: true,
    },
    badgeColor: {
      type: String,
      default: '#F25912',
      trim: true,
    },
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
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
    collection: 'sponsor_packages',
    timestamps: true,
    versionKey: false,
  }
);

const SponsorPackage = mongoose.model('SponsorPackage', sponsorPackageSchema);

module.exports = SponsorPackage;
