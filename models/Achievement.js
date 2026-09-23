// ============================================================
//  models/Achievement.js
//  Mongoose Schema for Achievements (achievements collection)
// ============================================================

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Achievement title is required.'],
      trim: true,
    },
    competitionName: {
      type: String,
      required: [true, 'Competition name is required.'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position/Rank is required.'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      trim: true,
      lowercase: true,
      default: 'competition',
    },
    date: {
      type: String,
      required: [true, 'Achievement date/year is required.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
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
    collection: 'achievements',
    timestamps: true,
    versionKey: false,
  }
);

achievementSchema.index({ order: 1, createdAt: 1 });
achievementSchema.index({ category: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

module.exports = Achievement;
