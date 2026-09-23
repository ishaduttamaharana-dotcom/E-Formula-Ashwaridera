// ============================================================
//  models/ActivityLog.js
//  Audit trail log for administrator actions across the CMS.
// ============================================================

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      default: '',
    },
    userEmail: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_DRAFT',
        'UPDATE_DRAFT',
        'PUBLISH',
        'ARCHIVE',
        'RESTORE_DRAFT',
        'DUPLICATE',
        'REORDER',
        'DELETE',
        'STATUS_UPDATE',
        'SETTINGS_UPDATE',
      ],
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    summary: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
