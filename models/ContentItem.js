// ============================================================
//  models/ContentItem.js
//  Universal Content Item Model storing instances for any ContentType
// ============================================================

const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true }, // hero, text, image, video, gallery, 2-col, 3-col, testimonials, services, projects, cta, faq, logo_strip, contact, custom_html, spacer
    title: { type: String, default: '' },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    settings: {
      layout: { type: String, default: 'contained' }, // full_width, contained, 2_col, 3_col, grid, masonry
      alignment: { type: String, default: 'left' },
      paddingTop: { type: String, default: '40px' },
      paddingBottom: { type: String, default: '40px' },
      backgroundColor: { type: String, default: 'transparent' },
      textColor: { type: String, default: 'inherit' },
      overlay: { type: String, default: '' },
      customClass: { type: String, default: '' },
      responsive: {
        desktop: { type: Boolean, default: true },
        tablet: { type: Boolean, default: true },
        mobile: { type: Boolean, default: true },
      },
    },
    order: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keywords: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    noIndex: { type: Boolean, default: false },
  },
  { _id: false }
);

const contentItemSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      required: [true, 'Content type slug is required.'],
      index: true,
      lowercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required.'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled', 'archived', 'inactive'],
      default: 'draft',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    // Dynamic fields store all type-specific key-value pairs
    fields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Visual Section Builder data array
    sections: [sectionSchema],
    // Taxonomies
    categories: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    // Associated Media
    media: [
      {
        url: String,
        publicId: String,
        alt: String,
        caption: String,
        type: String,
      },
    ],
    // SEO
    seo: {
      type: seoSchema,
      default: () => ({}),
    },
    // Published Snapshot for draft/published isolation
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    // Optimistic concurrency control
    lockVersion: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: 'admin',
    },
    updatedBy: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

contentItemSchema.index({ contentType: 1, status: 1, sortOrder: 1 });
contentItemSchema.index({ contentType: 1, slug: 1 });

const ContentItem = mongoose.model('ContentItem', contentItemSchema);

module.exports = ContentItem;
