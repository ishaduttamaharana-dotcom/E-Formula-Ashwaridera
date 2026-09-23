// ============================================================
//  models/GalleryAlbum.js
//  Mongoose Schema for Gallery Albums (gallery_albums collection)
// ============================================================

const mongoose = require('mongoose');

const galleryAlbumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Album name is required.'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    coverImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    coverPublicId: {
      type: String,
      trim: true,
      default: '',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    mediaCount: {
      type: Number,
      default: 0,
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
    collection: 'gallery_albums',
    timestamps: true,
    versionKey: false,
  }
);

galleryAlbumSchema.index({ order: 1, createdAt: 1 });

const GalleryAlbum = mongoose.model('GalleryAlbum', galleryAlbumSchema);

module.exports = GalleryAlbum;
