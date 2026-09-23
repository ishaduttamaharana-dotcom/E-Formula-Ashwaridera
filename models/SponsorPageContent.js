// ============================================================
//  models/SponsorPageContent.js
//  Mongoose Schema for Sponsor Page Control Center (Singleton).
//  Controls:
//    01. HEADER & SETTINGS
//    02. SPONSOR RAIL (Moving sponsor logos, speed, direction)
//    03. SPONSORSHIP CONTENT:
//        - Hero & Intro (text, media, CTA buttons)
//        - Sponsorship Tiers (cards, benefits, popular ribbon)
//        - Sponsor Enquiry & Form (contact details, brochure link, dynamic dropdown)
//    04. FOOTER (Shared reference)
//  Draft / Preview / Publish lifecycle with clean snapshots.
// ============================================================

const mongoose = require('mongoose');

const sponsorTierSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true }, // e.g. "Bronze"
    title: { type: String, required: true, trim: true }, // e.g. "Associate Sponsor"
    description: { type: String, default: '', trim: true }, // e.g. "Cash or in-kind support"
    benefits: [{ type: String, trim: true }],
    buttonText: { type: String, default: 'Get In Touch', trim: true },
    buttonUrl: { type: String, default: '#sponsor-form', trim: true },
    isPopular: { type: Boolean, default: false },
    popularRibbonText: { type: String, default: 'Popular', trim: true },
    badgeColor: { type: String, default: '#F25912', trim: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

const sponsorItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    tier: { type: String, default: 'Gold', trim: true },
    logoUrl: { type: String, default: '', trim: true },
    altText: { type: String, default: '', trim: true },
    websiteUrl: { type: String, default: '', trim: true },
    icon: { type: String, default: 'fas fa-bolt', trim: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

const sponsorPageContentSchema = new mongoose.Schema(
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

    // ─── 01. HEADER & SETTINGS ──────────────────────────────
    settings: {
      pageTitle: { type: String, default: 'Ashwa Riders — Become A Sponsor', trim: true },
      seoTitle: { type: String, default: 'Sponsor Us | Ashwa Riders Formula Student Electric', trim: true },
      seoDescription: { type: String, default: 'Partner with Ashwa Riders, SVPCET Formula Student Electric racing team. Explore sponsorship tiers and corporate collaboration.', trim: true },
      ogImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg', trim: true },
      canonicalUrl: { type: String, default: 'sponsors.html', trim: true },
      visible: { type: Boolean, default: true },
    },

    // ─── 02. SPONSOR RAIL ────────────────────────────────────
    rail: {
      visible: { type: Boolean, default: true },
      direction: { type: String, enum: ['right-to-left', 'left-to-right'], default: 'right-to-left' },
      speed: { type: Number, default: 32 }, // seconds per full loop
      pauseOnHover: { type: Boolean, default: true },
      animationEnabled: { type: Boolean, default: true },
      items: [sponsorItemSchema],
    },

    // ─── 03. SPONSORSHIP CONTENT ─────────────────────────────
    // Part A: Hero / Intro
    hero: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Partner With Us', trim: true },
      eyebrowIcon: { type: String, default: 'fas fa-handshake', trim: true },
      headingLine1: { type: String, default: 'Become A', trim: true },
      headingHighlight: { type: String, default: 'Sponsor', trim: true },
      description: {
        type: String,
        default: 'Put your brand on Tarkshya, our electric Formula Student car. Every season we race at Formula Bharat — your support drives us forward.',
        trim: true,
      },
      bgImageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg',
        trim: true,
      },
      videoUrl: { type: String, default: '', trim: true },
      overlay: { type: Boolean, default: true },
      overlayStrength: { type: Number, default: 72, min: 0, max: 100 },
      textAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      buttonPrimaryText: { type: String, default: 'Start Here', trim: true },
      buttonPrimaryUrl: { type: String, default: '#sponsor-form', trim: true },
      buttonPrimaryIcon: { type: String, default: 'fas fa-handshake', trim: true },
      buttonBrochureText: { type: String, default: 'Brochure', trim: true },
      buttonBrochureUrl: { type: String, default: '', trim: true },
      buttonBrochureVisible: { type: Boolean, default: true },
    },

    // Part B: Sponsorship Tiers
    tiersSection: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Sponsorship Tiers', trim: true },
      eyebrowIcon: { type: String, default: 'fas fa-layer-group', trim: true },
      headingLine1: { type: String, default: 'Choose Your', trim: true },
      headingHighlight: { type: String, default: 'Level', trim: true },
      description: {
        type: String,
        default: 'A starting point for a conversation — every partnership is tailored to what you and the team need.',
        trim: true,
      },
      bgImageUrl: {
        type: String,
        default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
        trim: true,
      },
      overlayStrength: { type: Number, default: 82, min: 0, max: 100 },
      tiers: [sponsorTierSchema],
    },

    // Part C: Sponsor Enquiry Section & Form
    enquirySection: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Get Started', trim: true },
      eyebrowIcon: { type: String, default: 'fas fa-paper-plane', trim: true },
      headingLine1: { type: String, default: 'Become A', trim: true },
      headingHighlight: { type: String, default: 'Sponsor', trim: true },
      description: {
        type: String,
        default: "Tell us about your organisation and we'll get back to you with a custom proposal.",
        trim: true,
      },
      contactHeading: { type: String, default: "Let's Talk", trim: true },
      contactDescription: {
        type: String,
        default: 'Cash, components, services, or expertise — if it helps us build a better car, we want to hear from you. Fill out the form and our sponsorship team will follow up within a few days.',
        trim: true,
      },
      email: { type: String, default: 'sponsors@ashwariders.in', trim: true },
      phone: { type: String, default: '+91 00000 00000', trim: true },
      address: { type: String, default: 'St. Vincent Pallotti CET, Nagpur', trim: true },
      brochureText: { type: String, default: 'Download sponsorship brochure', trim: true },
      brochureUrl: { type: String, default: '', trim: true },
      brochureVisible: { type: Boolean, default: true },
      formTitle: { type: String, default: 'Sponsorship Enquiry', trim: true },
      formDescription: { type: String, default: '', trim: true },
      submitButtonText: { type: String, default: 'Send Enquiry', trim: true },
      successMessage: {
        type: String,
        default: 'Thank you for your enquiry! Our sponsorship team will get back to you shortly.',
        trim: true,
      },
      errorMessage: {
        type: String,
        default: 'Failed to submit enquiry. Please check your inputs and try again.',
        trim: true,
      },
    },

    // ─── SNAPSHOTS ───────────────────────────────────────────
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
    collection: 'sponsor_page_contents',
    timestamps: true,
    versionKey: false,
  }
);

const SponsorPageContent = mongoose.model('SponsorPageContent', sponsorPageContentSchema);

module.exports = SponsorPageContent;
