// ============================================================
//  models/ContactMessage.js
//  Mongoose Schema for Contact Form Submissions (inbox).
// ============================================================

const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sender name is required.'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Sender email is required.'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address.'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required.'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters.'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required.'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters.'],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in_progress', 'closed', 'archived'],
      default: 'new',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
      trim: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

module.exports = ContactMessage;
