// ============================================================
//  models/HomePageContent.js
//  Mongoose Schema for the Unified Home Page Control Center
//  Collection: home_page_content (singleton document)
// ============================================================

const mongoose = require('mongoose');

const homePageContentSchema = new mongoose.Schema(
  {
    // Status & Versioning
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastPublishedAt: {
      type: Date,
      default: null,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },

    // ─── 01. HERO SECTION ─────────────────────────────────────
    hero: {
      transition: {
        type: {
          type: String,
          // Canonical transition enum — must match CMS selector and public renderer
          // Supported: fade | slide | crossfade | zoom | none
          enum: ['fade', 'slide', 'crossfade', 'zoom', 'none'],
          default: 'fade',
        },
        duration: {
          type: Number,
          default: 700,
        },
        autoplay: {
          type: Boolean,
          default: true,
        },
        interval: {
          type: Number,
          default: 5000,
        },
        pauseOnHover: {
          type: Boolean,
          default: true,
        },
      },
      slides: [
        {
          id: { type: String },
          badgeText: { type: String, default: 'Ashwa Riders — 2026 Season' },
          heading: { type: String, default: 'ASHWA RIDERS' },
          highlightText: { type: String, default: 'RIDERS' },
          subtitle: { type: String, default: 'Engineering Speed. Building Innovation. Racing the Future.' },
          description: { type: String, default: '' },
          mediaType: { type: String, enum: ['image', 'video'], default: 'video' },
          imageUrl: { type: String, default: '' },
          videoUrl: {
            type: String,
            default: 'https://res.cloudinary.com/frjck4sc/video/upload/v1784445874/vidssave.com_This_is_FORMULA_1_1080P_ex9dby.mp4',
          },
          posterUrl: { type: String, default: '' },
          mobileImageUrl: { type: String, default: '' },
          primaryBtnText: { type: String, default: 'Explore Our Car' },
          primaryBtnLink: { type: String, default: 'car.html' },
          primaryBtnVisible: { type: Boolean, default: true },
          secondaryBtnText: { type: String, default: 'Become a Sponsor' },
          secondaryBtnLink: { type: String, default: 'sponsors.html' },
          secondaryBtnVisible: { type: Boolean, default: true },
          overlayOpacity: { type: Number, min: 0, max: 100, default: 40 },
          textAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
          status: { type: String, enum: ['published', 'draft', 'hidden'], default: 'published' },
          order: { type: Number, default: 0 },
        },
      ],
      stats: [
        {
          label: { type: String, default: 'Team Members' },
          value: { type: String, default: '25' },
          order: { type: Number, default: 0 },
        },
      ],
    },

    // ─── 02. CAR + STORY (GARAGE TO GRID) ─────────────────────
    carStory: {
      sectionVisible: { type: Boolean, default: true },
      sectionLabel: { type: String, default: 'Garage To Grid · 2026 Season' },
      mainMedia: {
        desktopImageUrl: {
          type: String,
          default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png',
        },
        mobileImageUrl: { type: String, default: '' },
        videoUrl: { type: String, default: '' },
        altText: { type: String, default: 'Ashwa Riders Formula Student Car 2026' },
        position: { type: String, enum: ['center', 'left', 'right'], default: 'center' },
      },
      settings: {
        scrollEffect: {
          type: String,
          enum: ['horizontal', 'vertical', 'fade', 'parallax'],
          default: 'parallax',
        },
        cardTransition: {
          type: String,
          enum: ['fade', 'slide'],
          default: 'fade',
        },
        duration: { type: Number, default: 600 },
        autoProgression: { type: Boolean, default: false },
        progressIndicators: { type: Boolean, default: true },
        scrollIndicator: { type: Boolean, default: true },
      },
      cards: [
        {
          id: { type: String },
          position: { type: String, enum: ['tl', 'br', 'tr', 'bl'], default: 'tl' },
          stageIndex: { type: Number, default: 0 },
          stepNumber: { type: String, default: '01' },
          eyebrow: { type: String, default: 'Concept & Targets' },
          title: { type: String, default: 'The Idea Takes Shape.' },
          highlightWord: { type: String, default: 'Idea' },
          description: {
            type: String,
            default: 'Season begins with a blank whiteboard — lap-time targets, weight budget, and powertrain philosophy set before a single weld is struck.',
          },
          accentColor: { type: String, default: '#ff5a00' },
          stats: [
            {
              value: { type: String, default: '120' },
              unit: { type: String, default: 'KG' },
              label: { type: String, default: 'Target Weight' },
            },
          ],
          ctaText: { type: String, default: '' },
          ctaUrl: { type: String, default: '' },
          imageUrl: { type: String, default: '' },
          icon: { type: String, default: '' },
          visible: { type: Boolean, default: true },
          order: { type: Number, default: 0 },
        },
      ],
    },

    // ─── 03. NEWS & UPDATES SECTION ───────────────────────────
    news: {
      sectionSettings: {
        visible: { type: Boolean, default: true },
        eyebrow: { type: String, default: 'Latest News' },
        heading: { type: String, default: "What's Happening" },
        highlightText: { type: String, default: 'Happening' },
        description: { type: String, default: 'Stay updated with the latest from Ashwa Riders.' },
        viewAllText: { type: String, default: 'View All News' },
        viewAllUrl: { type: String, default: 'blog.html' },
      },
      articles: [
        {
          id: { type: String },
          title: { type: String, default: '' },
          slug: { type: String, default: '' },
          date: { type: String, default: '' },
          category: { type: String, default: 'News' },
          tag: { type: String, default: '' },
          icon: { type: String, default: 'fas fa-newspaper' },
          description: { type: String, default: '' },
          content: { type: String, default: '' },
          imageUrl: { type: String, default: '' },
          ctaText: { type: String, default: 'Read More' },
          ctaUrl: { type: String, default: 'blog.html' },
          status: { type: String, enum: ['published', 'draft', 'hidden'], default: 'published' },
          order: { type: Number, default: 0 },
        },
      ],
    },

    // ─── 04. FOOTER & SPONSORS ────────────────────────────────
    footerSponsors: {
      sponsorSection: {
        visible: { type: Boolean, default: true },
        eyebrow: { type: String, default: 'Sponsors & Partners' },
        heading: { type: String, default: 'Backed By The Best' },
        highlightText: { type: String, default: 'Best' },
        description: { type: String, default: 'Every tier of support that makes the car possible.' },
        viewAllUrl: { type: String, default: 'sponsors.html' },
        tiers: [
          {
            id: { type: String },
            name: { type: String, default: 'Gold Tier' },
            direction: { type: String, enum: ['forward', 'reverse'], default: 'forward' },
            visible: { type: Boolean, default: true },
            order: { type: Number, default: 0 },
            sponsors: [
              {
                id: { type: String },
                name: { type: String, default: '' },
                logoUrl: { type: String, default: '' },
                icon: { type: String, default: 'fas fa-award' },
                websiteUrl: { type: String, default: '' },
                tier: { type: String, default: 'Gold Tier' },
                description: { type: String, default: '' },
                visible: { type: Boolean, default: true },
                order: { type: Number, default: 0 },
              },
            ],
          },
        ],
      },
      sponsorCTA: {
        visible: { type: Boolean, default: true },
        eyebrow: { type: String, default: 'Partner With Us' },
        heading: { type: String, default: 'Become Our Sponsor' },
        highlightText: { type: String, default: 'Sponsor' },
        description: {
          type: String,
          default: 'Put your brand on a race car engineered by 25+ student engineers competing at Formula Bharat.',
        },
        primaryBtnText: { type: String, default: 'Become Our Sponsor' },
        primaryBtnUrl: { type: String, default: 'sponsors.html' },
        secondaryBtnText: { type: String, default: 'Download Sponsorship Brochure' },
        secondaryBtnUrl: { type: String, default: '/assets/docs/ashwa-riders-sponsorship-brochure.pdf' },
        brochureFile: { type: String, default: '' },
      },
      company: {
        brandName: { type: String, default: 'AshwaRiders' },
        description: {
          type: String,
          default: "Building India's most advanced Formula Student race car. Driven by excellence, fueled by passion.",
        },
        copyrightText: { type: String, default: '© 2026 Ashwa Riders. All rights reserved.' },
        builtByText: { type: String, default: 'Built by the Ashwa Riders Team' },
      },
      navColumns: [
        {
          id: { type: String },
          title: { type: String, default: 'Team' },
          order: { type: Number, default: 0 },
          links: [
            {
              label: { type: String, default: 'Members' },
              url: { type: String, default: 'team.html' },
              order: { type: Number, default: 0 },
              visible: { type: Boolean, default: true },
            },
          ],
        },
      ],
      socialLinks: [
        {
          platform: { type: String, default: 'Instagram' },
          icon: { type: String, default: 'fab fa-instagram' },
          url: { type: String, default: 'https://www.instagram.com/eformula_ashwariders/' },
          visible: { type: Boolean, default: true },
          order: { type: Number, default: 0 },
        },
      ],
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
    collection: 'home_page_content',
    timestamps: true,
    versionKey: false,
  }
);

const HomePageContent = mongoose.model('HomePageContent', homePageContentSchema);

module.exports = HomePageContent;
