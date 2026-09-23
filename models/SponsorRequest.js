// ============================================================
//  models/SponsorRequest.js
//  Mongoose Schema for Sponsor Applications (sponsor_requests)
// ============================================================

const mongoose = require('mongoose');

const sponsorRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },

    companyName: {
      type: String,
      required: [true, 'Company name is required.'],
      trim: true,
    },

    companyLogoUrl: {
      type: String,
      trim: true,
      default: '',
    },

    companyLogoPublicId: {
      type: String,
      trim: true,
      default: '',
    },

    industry: {
      type: String,
      trim: true,
      default: '',
    },

    website: {
      type: String,
      trim: true,
      default: '',
    },

    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required.'],
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
      default: '',
    },

    email: {
      type: String,
      required: [true, 'Email address is required.'],
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
    },

    sponsorshipType: {
      type: String,
      required: [true, 'Sponsorship type is required.'],
      trim: true,
    },

    sponsorshipAmount: {
      type: String,
      trim: true,
      default: '',
    },

    expectedCollaboration: {
      type: String,
      trim: true,
      default: '',
    },

    message: {
      type: String,
      trim: true,
      default: '',
    },

    documentUrl: {
      type: String,
      trim: true,
      default: '',
    },

    documentPublicId: {
      type: String,
      trim: true,
      default: '',
    },

    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },

    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Accepted', 'Rejected'],
      default: 'Pending',
      index: true,
    },
  },
  {
    collection: 'sponsor_requests',
    timestamps: true,
    versionKey: false,
  }
);

sponsorRequestSchema.index({ createdAt: -1 });

const SponsorRequest = mongoose.model('SponsorRequest', sponsorRequestSchema);

module.exports = SponsorRequest;
