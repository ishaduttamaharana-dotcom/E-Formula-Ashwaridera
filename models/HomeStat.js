// ============================================================
//  models/HomeStat.js
//  Mongoose Schema for Home Counter Strip (home_statistics collection).
// ============================================================

const mongoose = require('mongoose');

const homeStatSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Stat label is required.'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Stat value is required.'],
      trim: true,
    },
    displaySuffix: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: 'fas fa-chart-bar',
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
    collection: 'home_statistics',
    timestamps: true,
    versionKey: false,
  }
);

homeStatSchema.index({ order: 1, createdAt: 1 });

const HomeStat = mongoose.model('HomeStat', homeStatSchema);

module.exports = HomeStat;
