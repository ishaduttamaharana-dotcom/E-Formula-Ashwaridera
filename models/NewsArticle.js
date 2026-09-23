// ============================================================
//  models/NewsArticle.js
//  Mongoose Schema for News Articles & Updates (news_articles collection).
// ============================================================

const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Article title is required.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Article description is required.'],
      trim: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'News',
      trim: true,
    },
    date: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: 'fas fa-newspaper',
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    publicId: {
      type: String,
      trim: true,
      default: '',
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
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
    collection: 'news_articles',
    timestamps: true,
    versionKey: false,
  }
);

newsArticleSchema.index({ order: 1, createdAt: -1 });

const NewsArticle = mongoose.model('NewsArticle', newsArticleSchema);

module.exports = NewsArticle;
