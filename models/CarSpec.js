// ============================================================
//  models/CarSpec.js
//  Singleton model for Car Identity, Tech Specs, Features & Gallery.
// ============================================================

const mongoose = require('mongoose');

const carSpecSchema = new mongoose.Schema(
  {
    carName: {
      type: String,
      default: 'Tarkshya EV',
      required: true,
    },
    season: {
      type: String,
      default: '2026 Season',
    },
    heroTagline: {
      type: String,
      default: 'Central India’s First Electric Formula Student Race Car',
    },
    heroImageUrl: {
      type: String,
      default: '',
    },
    heroVideoUrl: {
      type: String,
      default: '',
    },
    summaryPills: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    // Technical Specification Groups (Chassis, Powertrain, Electronics, Aerodynamics, Brakes/Suspension)
    specGroups: [
      {
        groupName: { type: String, required: true }, // e.g. "Chassis & Frame", "Powertrain & Battery"
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
        rows: [
          {
            label: { type: String, required: true }, // e.g. "Peak Power"
            value: { type: String, required: true }, // e.g. "80 kW"
            unit: { type: String, default: '' },    // e.g. "kW"
          },
        ],
      },
    ],
    // Feature Panels
    features: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        icon: { type: String, default: 'fas fa-microchip' },
        statCallout: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        order: { type: Number, default: 0 },
      },
    ],
    // Car Detail Gallery
    detailGallery: [
      {
        imageUrl: { type: String, required: true },
        caption: { type: String, default: '' },
        order: { type: Number, default: 0 },
      },
    ],
    // Lifecycle & Publishing fields
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
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
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    collection: 'car_specs',
    timestamps: true,
    versionKey: false,
  }
);

const CarSpec = mongoose.model('CarSpec', carSpecSchema);

module.exports = CarSpec;
