// ============================================================
//  utils/publishingHelper.js
//  Standardized CMS Lifecycle & Publishing Engine.
//  Provides draft/published/archived workflow and snapshot isolation.
// ============================================================

const ActivityLog = require('../models/ActivityLog');

/**
 * Standard lifecycle Schema fields for Mongoose models.
 */
const lifecycleSchemaFields = {
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  publishedVersion: {
    type: mongooseSchemaTypeMixed(),
    default: null,
  },
  draftVersion: {
    type: mongooseSchemaTypeMixed(),
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
    type: require('mongoose').Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedBy: {
    type: require('mongoose').Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
};

function mongooseSchemaTypeMixed() {
  return require('mongoose').Schema.Types.Mixed;
}

/**
 * Log an administrator action to ActivityLog.
 */
const logActivity = async ({ user, action, resource, resourceId, summary, details = {}, req = null }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    await ActivityLog.create({
      user: user ? user._id || user.id : null,
      userName: user ? user.fullName || user.email || 'Admin' : 'System',
      userEmail: user ? user.email || '' : '',
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      summary,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Activity logging notice:', err.message);
  }
};

/**
 * Build snapshot object from document data for draft/published versions.
 */
const buildSnapshot = (docData) => {
  const clean = { ...docData };
  delete clean._id;
  delete clean.publishedVersion;
  delete clean.draftVersion;
  delete clean.status;
  delete clean.__v;
  return clean;
};

module.exports = {
  lifecycleSchemaFields,
  logActivity,
  buildSnapshot,
};
