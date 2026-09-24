// ============================================================
//  models/MediaAsset.js
//  Cloudinary media metadata asset tracking with comprehensive schema.
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
    storageKey: {
      type: String,
      trim: true,
      index: true,
      default: function () {
        return this.publicId;
      },
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
    filename: {
      type: String,
      trim: true,
      default: '',
    },
    originalName: {
      type: String,
      trim: true,
      default: '',
    },
    mimeType: {
      type: String,
      trim: true,
      default: '',
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw'],
      default: 'image',
      index: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document', 'audio', 'other'],
      default: function () {
        if (this.resourceType === 'video') return 'video';
        if (this.resourceType === 'raw') return 'document';
        return 'image';
      },
    },
    format: {
      type: String,
      trim: true,
      default: '',
    },
    bytes: {
      type: Number,
      default: 0,
    },
    size: {
      type: Number,
      default: function () {
        return this.bytes || 0;
      },
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0, // Video duration in seconds
    },
    folder: {
      type: String,
      trim: true,
      default: 'ashwa_cms',
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
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
mediaAssetSchema.index({ mediaType: 1, createdAt: -1 });

// Ensure size & storageKey sync before save
mediaAssetSchema.pre('save', function () {
  if (!this.storageKey && this.publicId) {
    this.storageKey = this.publicId;
  }
  if (!this.size && this.bytes) {
    this.size = this.bytes;
  }
  if (!this.secureUrl && this.url) {
    this.secureUrl = this.url;
  }
});

const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

module.exports = MediaAsset;
