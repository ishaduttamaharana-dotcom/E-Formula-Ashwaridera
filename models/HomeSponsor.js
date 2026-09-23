// ============================================================
//  models/HomeSponsor.js
//  Mongoose Schema for Partners Preview (home_sponsors collection)
// ============================================================

const mongoose = require('mongoose');

const homeSponsorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sponsor name is required.'],
      trim: true,
    },

    tier: {
      type: String,
      enum: ['Gold', 'Silver', 'Bronze'],
      default: 'Gold',
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

    websiteLink: {
      type: String,
      trim: true,
      default: '#',
    },

    icon: {
      type: String,
      default: 'fas fa-crown',
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'home_sponsors',
    timestamps: true,
    versionKey: false,
  }
);

homeSponsorSchema.index({ tier: 1, order: 1 });

const HomeSponsor = mongoose.model('HomeSponsor', homeSponsorSchema);

module.exports = HomeSponsor;
