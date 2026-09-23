// ============================================================
//  controllers/adminRevisionController.js
//  Revision history tracking, comparison, and restoration.
// ============================================================

const ContentRevision = require('../models/ContentRevision');
const ActivityLog = require('../models/ActivityLog');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Resource model registry for restoration
const resourceModelRegistry = {
  HeroSlide: require('../models/HeroSlide'),
  BuildStage: require('../models/BuildStage'),
  NewsArticle: require('../models/NewsArticle'),
  HomeStat: require('../models/HomeStat'),
  TeamMember: require('../models/TeamMember'),
  Achievement: require('../models/Achievement'),
  GalleryAlbum: require('../models/GalleryAlbum'),
  GalleryImage: require('../models/GalleryImage'),
  Sponsor: require('../models/Sponsor'),
  SponsorPackage: require('../models/SponsorPackage'),
  AboutContent: require('../models/AboutContent'),
  CarSpec: require('../models/CarSpec'),
  ContactInfo: require('../models/ContactInfo'),
  NavFooterSettings: require('../models/NavFooterSettings'),
  SiteSeoSettings: require('../models/SiteSeoSettings'),
};

/**
 * Helper to record an immutable revision snapshot.
 */
const recordRevision = async ({ resourceType, resourceId, version, data, user, action, summary }) => {
  try {
    const revision = await ContentRevision.create({
      resourceType,
      resourceId: String(resourceId),
      version: version || 1,
      data,
      author: user._id || user.id,
      authorName: user.fullName || user.name || 'Admin',
      authorEmail: user.email || '',
      action: action || 'UPDATE_DRAFT',
      summary: summary || `Saved revision v${version || 1}`,
    });

    // Also record Activity Log entry
    await ActivityLog.create({
      user: user._id || user.id,
      userName: user.fullName || user.name || 'Admin',
      userEmail: user.email || '',
      action: action || 'UPDATE_DRAFT',
      resource: resourceType,
      resourceId: String(resourceId),
      summary: summary || `Revision v${version || 1} created`,
      details: { revisionId: revision._id, version },
    });

    return revision;
  } catch (err) {
    console.error('❌  Failed to record content revision:', err.message);
    return null;
  }
};

/**
 * GET /api/v1/admin/revisions
 * List content revisions with filtering & pagination
 */
const getRevisions = async (req, res, next) => {
  try {
    const { resourceType, resourceId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (resourceType) filter.resourceType = resourceType;
    if (resourceId) filter.resourceId = String(resourceId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const revisions = await ContentRevision.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'fullName email');

    const total = await ContentRevision.countDocuments(filter);

    return sendSuccess(res, 200, 'Revisions retrieved successfully.', revisions, {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/revisions/:id
 * Retrieve a specific historical revision by ID
 */
const getRevisionById = async (req, res, next) => {
  try {
    const revision = await ContentRevision.findById(req.params.id).populate('author', 'fullName email');
    if (!revision) {
      return sendError(res, 404, 'Revision not found.');
    }
    return sendSuccess(res, 200, 'Revision retrieved.', revision);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/revisions/:id/restore
 * Restores a historical revision snapshot by creating a new draft version on the resource.
 */
const restoreRevisionToDraft = async (req, res, next) => {
  try {
    const revision = await ContentRevision.findById(req.params.id);
    if (!revision) {
      return sendError(res, 404, 'Revision not found.');
    }

    const Model = resourceModelRegistry[revision.resourceType];
    if (!Model) {
      return sendError(res, 400, `Unsupported resource type '${revision.resourceType}' for restoration.`);
    }

    // Singletons vs Repeatable models
    let record;
    if (['AboutContent', 'CarSpec', 'ContactInfo', 'NavFooterSettings', 'SiteSeoSettings'].includes(revision.resourceType)) {
      record = await Model.findOne();
      if (!record) record = new Model({});
    } else {
      record = await Model.findById(revision.resourceId);
      if (!record) {
        return sendError(res, 404, `Target resource '${revision.resourceType}' with ID ${revision.resourceId} no longer exists.`);
      }
    }

    // Extract snapshot data (excluding system immutable keys)
    const restoredData = { ...revision.data };
    delete restoredData._id;
    delete restoredData.publishedVersion;
    delete restoredData.createdAt;
    delete restoredData.updatedAt;

    // Apply restored data to current record's draft fields
    Object.assign(record, restoredData);
    record.status = 'draft';
    record.version = (record.version || 1) + 1;

    await record.save();

    // Log the restoration action as a new revision
    await recordRevision({
      resourceType: revision.resourceType,
      resourceId: record._id,
      version: record.version,
      data: record.toObject(),
      user: req.user,
      action: 'RESTORE_DRAFT',
      summary: `Restored draft from revision v${revision.version}`,
    });

    return sendSuccess(res, 200, `Successfully restored draft to historical revision v${revision.version}.`, record);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  recordRevision,
  getRevisions,
  getRevisionById,
  restoreRevisionToDraft,
};
