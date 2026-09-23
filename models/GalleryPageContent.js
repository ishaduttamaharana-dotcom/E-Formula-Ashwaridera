// ============================================================
//  models/GalleryPageContent.js
//  Mongoose Schema for Gallery Page Control Center (Singleton).
//  Controls:
//    01. HERO (Label, Heading, Highlight, Description, Media Type, Background Image/Video, Overlay)
//    02. CONFIGURABLE CATEGORIES
//    03. RECRUITMENT CTA
//    04. PAGE SETTINGS & SEO
//  Draft / Preview / Publish lifecycle with clean snapshots.
// ============================================================

const mongoose = require('mongoose');

const galleryCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', trim: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
  },
  { _id: false }
);

const galleryPageContentSchema = new mongoose.Schema(
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

    // ─── PAGE SETTINGS & SEO ─────────────────────────────────
    settings: {
      pageTitle: { type: String, default: 'Ashwa Riders — Gallery', trim: true },
      seoTitle: { type: String, default: 'Moments in Motion — Gallery | Ashwa Riders Formula Student', trim: true },
      seoDescription: { type: String, default: 'Explore photos, track videos, car testing, workshop builds, and competition moments of the Ashwa Riders electric racing team.', trim: true },
      ogImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg', trim: true },
      canonicalUrl: { type: String, default: 'gallery.html', trim: true },
      visible: { type: Boolean, default: true },
    },

    // ─── 01. GALLERY HERO ────────────────────────────────────
    hero: {
      visible: { type: Boolean, default: true },
      label: { type: String, default: 'GALLERY', trim: true },
      eyebrow: { type: String, default: 'GALLERY', trim: true },
      headingLine1: { type: String, default: 'MOMENTS IN', trim: true },
      headingHighlight: { type: String, default: 'MOTION', trim: true },
      headingLine2: { type: String, default: '', trim: true },
      description: { type: String, default: 'A visual journey through our competitions, events, and the everyday life of the Ashwa Riders team.', trim: true },
      mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
      bgImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg', trim: true },
      desktopImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg', trim: true },
      videoUrl: { type: String, default: '', trim: true },
      posterUrl: { type: String, default: '', trim: true },
      altText: { type: String, default: 'Ashwa Riders Gallery Hero Showcase', trim: true },
      backgroundPosition: { type: String, default: 'center 40%', trim: true },
      overlay: { type: Boolean, default: true },
      overlayStrength: { type: Number, default: 55, min: 0, max: 100 },
      textAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      entranceAnimation: { type: String, enum: ['slide-up', 'fade', 'zoom-in', 'none'], default: 'slide-up' },
    },

    // ─── 02. CONFIGURABLE CATEGORIES ─────────────────────────
    categories: {
      type: [galleryCategorySchema],
      default: [
        { id: 'all', name: 'All', slug: 'all', description: 'All media', order: 1, visible: true, isSystem: true },
        { id: 'image', name: 'Images', slug: 'image', description: 'Photographs and stills', order: 2, visible: true, isSystem: true },
        { id: 'video', name: 'Videos', slug: 'video', description: 'Recap and track video footage', order: 3, visible: true, isSystem: true },
        { id: 'competition', name: 'Competition', slug: 'competition', description: 'Formula Bharat track runs and dynamic events', order: 4, visible: true, isSystem: false },
        { id: 'workshop', name: 'Workshop', slug: 'workshop', description: 'Fabrication, assembly, and CAD engineering', order: 5, visible: true, isSystem: false },
        { id: 'testing', name: 'Testing', slug: 'testing', description: 'Track testing and dyno calibration', order: 6, visible: true, isSystem: false },
        { id: 'events', name: 'Events', slug: 'events', description: 'Team celebrations, unveilings, and exhibitions', order: 7, visible: true, isSystem: false },
        { id: 'formula-bharat', name: 'Formula Bharat', slug: 'formula-bharat', description: 'Official season competitions', order: 8, visible: true, isSystem: false },
      ],
    },

    // ─── 03. RECRUITMENT CTA ─────────────────────────────────
    cta: {
      visible: { type: Boolean, default: true },
      heading: { type: String, default: 'BE PART OF THE', trim: true },
      highlightedHeading: { type: String, default: 'STORY', trim: true },
      description: { type: String, default: 'Join our team and create your own moments of engineering excellence.', trim: true },
      buttonText: { type: String, default: 'JOIN THE TEAM', trim: true },
      buttonUrl: { type: String, default: 'index.html#recruitment', trim: true },
      buttonIcon: { type: String, default: 'fas fa-user-plus', trim: true },
      openInNewTab: { type: Boolean, default: false },
      backgroundColor: { type: String, default: '#000000', trim: true },
      bgImageUrl: { type: String, default: '', trim: true },
    },

    // ─── DRAFT & PUBLISHED SNAPSHOTS ─────────────────────────
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
    collection: 'gallery_page_contents',
    timestamps: true,
    versionKey: false,
  }
);

const GalleryPageContent = mongoose.model('GalleryPageContent', galleryPageContentSchema);

module.exports = GalleryPageContent;
