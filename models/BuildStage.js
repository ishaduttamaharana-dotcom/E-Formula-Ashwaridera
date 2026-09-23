// ============================================================
//  models/BuildStage.js
//  Canonical Mongoose Schema for Garage-to-Grid build timeline stages.
// ============================================================

const mongoose = require('mongoose');

const buildStageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Stage title is required.'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Stage description is required.'],
      trim: true,
    },
    stageNumber: {
      type: Number,
      default: 1,
    },
    icon: {
      type: String,
      default: 'fas fa-wrench',
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
    altText: {
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
    blocks: [
      {
        id: { type: String },
        type: { type: String, required: true }, // heading, text, image, button, video, gallery, quote, specification, divider
        content: { type: mongoose.Schema.Types.Mixed, default: {} },
        sortOrder: { type: Number, default: 0 },
        visible: { type: Boolean, default: true },
      },
    ],
    appearance: {
      theme: { type: String, default: 'dark' },
      accentColor: { type: String, default: '#ff751f' },
      layout: { type: String, default: 'standard' },
    },
    advanced: {
      slug: { type: String, default: '' },
      cssClass: { type: String, default: '' },
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
    collection: 'build_stages',
    timestamps: true,
    versionKey: false,
  }
);

buildStageSchema.index({ order: 1, createdAt: 1 });

const BuildStage = mongoose.model('BuildStage', buildStageSchema);

module.exports = BuildStage;
