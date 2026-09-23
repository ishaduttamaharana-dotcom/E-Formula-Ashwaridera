// ============================================================
//  models/MediaAsset.js
//  Cloudinary media metadata asset tracking.
// ============================================================

const mongoose = require('mongoose');

const mediaAssetSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: [true, 'Cloudinary publicId is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Asset URL is required.'],
      trim: true,
    },
    secureUrl: {
      type: String,
      trim: true,
      default: '',
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'image',
    },
    format: {
      type: String,
      default: '',
    },
    bytes: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    altText: {
      type: String,
      default: '',
      trim: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    referenceCount: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

mediaAssetSchema.index({ resourceType: 1, createdAt: -1 });

const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

module.exports = MediaAsset;
