// ============================================================
//  models/JoinApplication.js
//  Mongoose Schema for Join Team Applications (join_team_applications)
// ============================================================

const mongoose = require('mongoose');

const joinApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
    },

    dateOfBirth: {
      type: String,
      trim: true,
      default: '',
    },

    gender: {
      type: String,
      trim: true,
      default: '',
    },

    college: {
      type: String,
      required: [true, 'College name is required.'],
      trim: true,
    },

    university: {
      type: String,
      trim: true,
      default: '',
    },

    branch: {
      type: String,
      required: [true, 'Branch is required.'],
      trim: true,
    },

    currentYear: {
      type: String,
      required: [true, 'Current year is required.'],
      trim: true,
    },

    graduationYear: {
      type: String,
      trim: true,
      default: '',
    },

    department: {
      type: String,
      required: [true, 'Department applying for is required.'],
      trim: true,
    },

    technicalSkills: {
      type: String,
      trim: true,
      default: '',
    },

    programmingLanguages: {
      type: String,
      trim: true,
      default: '',
    },

    softwareTools: {
      type: String,
      trim: true,
      default: '',
    },

    certifications: {
      type: String,
      trim: true,
      default: '',
    },

    linkedin: {
      type: String,
      trim: true,
      default: '',
    },

    github: {
      type: String,
      trim: true,
      default: '',
    },

    portfolio: {
      type: String,
      trim: true,
      default: '',
    },

    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },

    resumePublicId: {
      type: String,
      trim: true,
      default: '',
    },

    motivation: {
      type: String,
      trim: true,
      default: '',
    },

    projectExperience: {
      type: String,
      trim: true,
      default: '',
    },

    formulaStudentExperience: {
      type: String,
      trim: true,
      default: '',
    },

    additionalInformation: {
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
    collection: 'join_team_applications',
    timestamps: true,
    versionKey: false,
  }
);

joinApplicationSchema.index({ createdAt: -1 });

const JoinApplication = mongoose.model('JoinApplication', joinApplicationSchema);

module.exports = JoinApplication;
