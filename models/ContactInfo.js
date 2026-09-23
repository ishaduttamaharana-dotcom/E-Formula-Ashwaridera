// ============================================================
//  models/ContactInfo.js
//  Mongoose Schema for Contact Information (contact_information collection)
//  Single-document singleton pattern.
// ============================================================

const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      trim: true,
      default: 'eformulaashwariders@gmail.com',
    },
    phone: {
      type: String,
      trim: true,
      default: '+91 90961 10224',
    },
    alternatePhone: {
      type: String,
      trim: true,
      default: '+91 93259 66459',
    },
    address: {
      type: String,
      trim: true,
      default: 'SVPCET, Gavsi Manapur, Wardha Road, Nagpur, Maharashtra 441108',
    },
    googleMapUrl: {
      type: String,
      trim: true,
      default: 'https://www.google.com/maps?q=St.+Vincent+Pallotti+College+of+Engineering+and+Technology,+Gavsi+Manapur,+Wardha+Road,+Nagpur,+Maharashtra+441108&output=embed',
    },
    website: {
      type: String,
      trim: true,
      default: 'https://ashwariders.com',
    },
    facebook: {
      type: String,
      trim: true,
      default: 'https://facebook.com/ashwariders',
    },
    instagram: {
      type: String,
      trim: true,
      default: 'https://www.instagram.com/eformula_ashwariders/',
    },
    linkedin: {
      type: String,
      trim: true,
      default: 'https://www.linkedin.com/company/e-formula-ashwa-riders',
    },
    youtube: {
      type: String,
      trim: true,
      default: 'https://youtube.com/ashwariders',
    },
    twitter: {
      type: String,
      trim: true,
      default: 'https://x.com/ashwariders',
    },
    whatsapp: {
      type: String,
      trim: true,
      default: '+91 90961 10224',
    },
    officeHours: {
      type: String,
      trim: true,
      default: 'Mon–Sat, 10 AM – 6 PM IST',
    },
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
    collection: 'contact_information',
    timestamps: true,
    versionKey: false,
  }
);

const ContactInfo = mongoose.model('ContactInfo', contactInfoSchema);

module.exports = ContactInfo;
