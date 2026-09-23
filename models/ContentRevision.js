// ============================================================
//  models/ContentRevision.js
//  Immutable historical revision snapshot model for CMS content.
// ============================================================

const mongoose = require('mongoose');

const contentRevisionSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      default: '',
    },
    authorEmail: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      enum: ['CREATE_DRAFT', 'UPDATE_DRAFT', 'PUBLISH', 'ARCHIVE', 'RESTORE_DRAFT', 'DUPLICATE', 'SETTINGS_UPDATE'],
      default: 'UPDATE_DRAFT',
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

contentRevisionSchema.index({ resourceType: 1, resourceId: 1, version: -1 });

const ContentRevision = mongoose.model('ContentRevision', contentRevisionSchema);

module.exports = ContentRevision;
