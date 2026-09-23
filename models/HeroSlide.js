// ============================================================
//  models/HeroSlide.js
//  Mongoose Schema for Home Page Hero Slides (hero_slides collection).
// ============================================================

const mongoose = require('mongoose');

const heroSlideSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: [true, 'Main heading is required.'],
      trim: true,
      default: 'ASHWA RIDERS',
    },
    subtitle: {
      type: String,
      trim: true,
      default: 'Engineering Speed. Building Innovation. Racing the Future.',
    },
    badgeText: {
      type: String,
      trim: true,
      default: 'Ashwa Riders — 2026 Season',
    },
    mediaType: {
      type: String,
      enum: ['video', 'image'],
      default: 'video',
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    mobileImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    primaryBtnText: {
      type: String,
      trim: true,
      default: 'Explore Our Car',
    },
    primaryBtnLink: {
      type: String,
      trim: true,
      default: 'car.html',
    },
    secondaryBtnText: {
      type: String,
      trim: true,
      default: 'Become a Sponsor',
    },
    secondaryBtnLink: {
      type: String,
      trim: true,
      default: 'sponsors.html',
    },
    overlayOpacity: {
      type: Number,
      min: 0,
      max: 100,
      default: 40,
    },
    textAlignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center',
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
    collection: 'hero_slides',
    timestamps: true,
    versionKey: false,
  }
);

heroSlideSchema.index({ order: 1, createdAt: -1 });

const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);

module.exports = HeroSlide;
