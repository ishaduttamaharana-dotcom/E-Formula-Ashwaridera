// ============================================================
//  models/TeamPageContent.js
//  Singleton Model for Team Page Control Center.
//  Manages all Team Page sections:
//    01. HERO
//    02. TEAM MEMBERS (Section headings + controlled Filters)
//    03. JOIN TEAM / CTA
//    04. FOOTER (Reference metadata)
//    05. PAGE SETTINGS & SEO
// ============================================================

const mongoose = require('mongoose');

const teamPageContentSchema = new mongoose.Schema(
  {
    // Page Settings & SEO
    settings: {
      pageTitle: { type: String, default: 'Ashwa Riders — Team' },
      seoTitle: { type: String, default: 'Team — Formula Bharat Electric Racing | Ashwa Riders' },
      seoDescription: { type: String, default: 'Meet the engineers, designers, and innovators behind Ashwa Riders Formula Student Electric team.' },
      ogImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg' },
      canonicalUrl: { type: String, default: 'team.html' },
      visible: { type: Boolean, default: true },
    },

    // 01 HERO
    hero: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'FORMULA BHARAT — 2026 SEASON' },
      headingLine1: { type: String, default: 'THE' },
      headingHighlight: { type: String, default: 'DRIVING FORCE' },
      headingLine2: { type: String, default: 'BEHIND ASHWA RIDERS' },
      description: { type: String, default: 'A multidisciplinary team of engineers, designers, and innovators working together to build the future of motorsport.' },
      desktopImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg' },
      mobileImageUrl: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      posterUrl: { type: String, default: '' },
      altText: { type: String, default: 'Ashwa Riders Team Photograph' },
      textAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      contentPosition: { type: String, enum: ['top', 'center', 'bottom'], default: 'center' },
      heroHeight: { type: String, default: '46vh' },
      overlayStrength: { type: Number, default: 70 },
      backgroundPosition: { type: String, default: 'center 30%' },
      entranceAnimation: { type: String, default: 'slide-up' },
      transition: { type: String, default: 'fade' },
      transitionDuration: { type: Number, default: 800 },
    },

    // 02 TEAM MEMBERS SECTION CONFIG & FILTERS
    membersSection: {
      eyebrow: { type: String, default: 'FILTER' },
      title: { type: String, default: 'MEET THE' },
      highlightText: { type: String, default: 'RIDERS' },
      subtitle: { type: String, default: 'Click a department to view specific teams.' },
      description: { type: String, default: 'Click a department to view specific teams.' },
    },

    // Controlled Department / Category Filters
    filters: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
        visible: { type: Boolean, default: true },
      },
    ],

    // 03 JOIN TEAM / CTA
    cta: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'GET INVOLVED' },
      heading: { type: String, default: 'BECOME A' },
      highlightedHeading: { type: String, default: 'RIDER' },
      description: { type: String, default: "We're always looking for passionate engineers, designers, and innovators to join our family." },
      buttonText: { type: String, default: 'APPLY NOW' },
      buttonUrl: { type: String, default: 'index.html#recruitment' },
      buttonIcon: { type: String, default: 'fas fa-user-plus' },
      openInNewTab: { type: Boolean, default: false },
      backgroundColor: { type: String, default: '#000000' },
      bgImageUrl: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      gridEffect: { type: Boolean, default: true },
    },

    // Lifecycle & Publishing
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
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    collection: 'team_page_content',
    timestamps: true,
    versionKey: false,
  }
);

const TeamPageContent = mongoose.model('TeamPageContent', teamPageContentSchema);

module.exports = TeamPageContent;
