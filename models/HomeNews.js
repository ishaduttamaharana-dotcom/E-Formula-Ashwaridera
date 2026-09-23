// ============================================================
//  models/HomeNews.js
//  Mongoose Schema for What's Happening News Cards (home_news collection)
// ============================================================

const mongoose = require('mongoose');

const homeNewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'News title is required.'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    date: {
      type: String,
      trim: true,
      default: '',
    },

    category: {
      type: String,
      trim: true,
      default: 'AIR 8',
    },

    icon: {
      type: String,
      default: 'fas fa-trophy',
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

    buttonText: {
      type: String,
      trim: true,
      default: 'Read Article',
    },

    buttonLink: {
      type: String,
      trim: true,
      default: 'blog.html',
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'home_news',
    timestamps: true,
    versionKey: false,
  }
);

homeNewsSchema.index({ order: 1, createdAt: 1 });

const HomeNews = mongoose.model('HomeNews', homeNewsSchema);

module.exports = HomeNews;
