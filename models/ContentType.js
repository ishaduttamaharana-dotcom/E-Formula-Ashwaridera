// ============================================================
//  models/ContentType.js
//  Model defining reusable content types (Hero, Articles, Projects, etc.)
// ============================================================

const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: [
        'text', 'short_text', 'long_text', 'rich_text', 'textarea', 'heading', 'eyebrow', 'quote', 'caption',
        'media', 'image', 'multi_image', 'video', 'audio', 'bg_image', 'bg_video', 'mobile_media',
        'link', 'button', 'select', 'dropdown', 'radio', 'checkbox', 'multi_select', 'tags', 'categories',
        'number', 'percentage', 'duration', 'sort_order', 'boolean', 'active', 'featured', 'date',
        'color', 'alignment', 'position', 'slider', 'custom_css'
      ],
      default: 'text'
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: '' },
    helpText: { type: String, default: '' },
    options: [{ type: String }], // For select, dropdown, radio
    group: { type: String, default: 'General' }, // Field group tab
  },
  { _id: false }
);

const contentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Content type name is required.'],
      trim: true,
    },
    singularName: {
      type: String,
      required: true,
      trim: true,
    },
    pluralName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    icon: {
      type: String,
      default: 'folder',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false, // True for pre-seeded built-in types
    },
    fields: [fieldSchema],
    features: {
      publishing: { type: Boolean, default: true },
      featured: { type: Boolean, default: true },
      categories: { type: Boolean, default: true },
      tags: { type: Boolean, default: true },
      seo: { type: Boolean, default: true },
      sections: { type: Boolean, default: true }, // Visual section builder enabled
      revisions: { type: Boolean, default: true },
    },
    listColumns: [{ type: String }], // Keys to show in table view
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const ContentType = mongoose.model('ContentType', contentTypeSchema);

module.exports = ContentType;
