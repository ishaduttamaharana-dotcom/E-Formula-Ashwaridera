// ============================================================
//  models/TeamMember.js
//  Mongoose Schema for Team Members (team_members collection)
// ============================================================

const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    fullName: {
      type: String,
      required: [true, 'Full name / Display name is required.'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position/Role is required.'],
      trim: true,
    },
    roleCategory: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required.'],
      trim: true,
      lowercase: true,
      default: 'mechanical',
    },
    categories: {
      type: [String],
      default: [],
    },
    seasonYear: {
      type: String,
      default: '2026',
      trim: true,
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
    },
    academicBranch: {
      type: String,
      trim: true,
      default: '',
    },
    isAlumni: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '#',
    },
    github: {
      type: String,
      trim: true,
      default: '#',
    },
    instagram: {
      type: String,
      trim: true,
      default: '',
    },
    otherSocial: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageAlt: {
      type: String,
      trim: true,
      default: '',
    },
    publicId: {
      type: String,
      trim: true,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
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
    collection: 'team_members',
    timestamps: true,
    versionKey: false,
  }
);

teamMemberSchema.index({ order: 1, createdAt: 1 });
teamMemberSchema.index({ department: 1 });

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;
