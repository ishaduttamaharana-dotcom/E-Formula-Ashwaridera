// ============================================================
//  models/AchievementsPageContent.js
//  Mongoose Schema for Achievements Page Control Center (singleton)
//  Controls:
//    01. HEADER & SETTINGS
//    02. OUR ACHIEVEMENTS (Eyebrow, title, highlight, description,
//        dynamic categories, achievements roster)
//    03. OUR JOURNEY (Timeline section, background image & overlay,
//        chronological timeline events)
//    04. FOOTER (Shared reference)
//  Includes atomic Draft / Publish versioning snapshots.
// ============================================================

const mongoose = require('mongoose');

const achievementsPageContentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastPublishedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
    settings: {
      pageTitle: {
        type: String,
        default: 'Ashwa Riders — Achievements',
        trim: true,
      },
      seoTitle: {
        type: String,
        default: 'Achievements & Milestones | Ashwa Riders Formula Student Electric',
        trim: true,
      },
      seoDescription: {
        type: String,
        default: 'Explore racing achievements, national awards, and engineering milestones of Ashwa Riders, Formula Student Electric team from central India.',
        trim: true,
      },
      ogImageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483846/SAVE_20260111_173616.jpg_1_srifam.jpg',
        trim: true,
      },
      canonicalUrl: {
        type: String,
        default: 'achievements.html',
        trim: true,
      },
      visible: {
        type: Boolean,
        default: true,
      },
    },
    achievementsSection: {
      eyebrow: {
        type: String,
        default: 'Our Achievements',
        trim: true,
      },
      eyebrowIcon: {
        type: String,
        default: 'fas fa-medal',
        trim: true,
      },
      heading: {
        type: String,
        default: 'Milestones That Define Us',
        trim: true,
      },
      headingHighlight: {
        type: String,
        default: 'Define Us',
        trim: true,
      },
      description: {
        type: String,
        default: "From our first Formula Bharat entry to building central India's first electric race car — every achievement tells a story.",
        trim: true,
      },
      visible: {
        type: Boolean,
        default: true,
      },
      bgImageUrl: {
        type: String,
        default: '',
        trim: true,
      },
      overlayStrength: {
        type: Number,
        default: 0.8,
        min: 0,
        max: 1,
      },
      categories: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          slug: { type: String, required: true },
          icon: { type: String, default: 'fas fa-trophy' },
          order: { type: Number, default: 1 },
          enabled: { type: Boolean, default: true },
        },
      ],
      achievements: [
        {
          id: { type: String, required: true },
          year: { type: String, default: '2026', trim: true },
          title: { type: String, required: true, trim: true },
          description: { type: String, default: '', trim: true },
          category: { type: String, default: 'competition', trim: true },
          imageUrl: { type: String, default: '', trim: true },
          imageAlt: { type: String, default: '', trim: true },
          event: { type: String, default: '', trim: true },
          rank: { type: String, default: '', trim: true },
          awardName: { type: String, default: '', trim: true },
          location: { type: String, default: '', trim: true },
          organization: { type: String, default: '', trim: true },
          externalUrl: { type: String, default: '', trim: true },
          tags: [{ type: String, trim: true }],
          order: { type: Number, default: 1 },
          published: { type: Boolean, default: true },
          featured: { type: Boolean, default: false },
        },
      ],
    },
    timelineSection: {
      eyebrow: {
        type: String,
        default: 'Our Journey',
        trim: true,
      },
      eyebrowIcon: {
        type: String,
        default: 'fas fa-history',
        trim: true,
      },
      heading: {
        type: String,
        default: 'Our Timeline',
        trim: true,
      },
      headingHighlight: {
        type: String,
        default: 'Timeline',
        trim: true,
      },
      description: {
        type: String,
        default: "Every year brought new challenges, learnings, and results — here's how we got here.",
        trim: true,
      },
      bgImageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784492223/IMG_9374_cile31.jpg',
        trim: true,
      },
      overlayStrength: {
        type: Number,
        default: 0.78,
        min: 0,
        max: 1,
      },
      visible: {
        type: Boolean,
        default: true,
      },
      events: [
        {
          id: { type: String, required: true },
          year: { type: String, required: true, trim: true },
          title: { type: String, required: true, trim: true },
          description: { type: String, default: '', trim: true },
          tags: [{ type: String, trim: true }],
          order: { type: Number, default: 1 },
          published: { type: Boolean, default: true },
        },
      ],
    },
    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    collection: 'achievements_page_contents',
    timestamps: true,
  }
);

const AchievementsPageContent = mongoose.model('AchievementsPageContent', achievementsPageContentSchema);

module.exports = AchievementsPageContent;
