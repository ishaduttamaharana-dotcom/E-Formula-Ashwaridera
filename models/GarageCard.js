// ============================================================
//  models/GarageCard.js
//  Mongoose Schema for Garage To Grid Cards (garage_cards collection)
// ============================================================

const mongoose = require('mongoose');

const garageCardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required.'],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
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
      default: '',
    },

    buttonLink: {
      type: String,
      trim: true,
      default: '',
    },

    icon: {
      type: String,
      default: 'fas fa-wrench',
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
    collection: 'garage_cards',
    timestamps: true,
    versionKey: false,
  }
);

garageCardSchema.index({ order: 1, createdAt: 1 });

const GarageCard = mongoose.model('GarageCard', garageCardSchema);

module.exports = GarageCard;
