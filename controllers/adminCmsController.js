// ============================================================
//  controllers/adminCmsController.js
//  Generic Admin Controller for Repeatable CMS Content Resources.
//  Implements: List, Retrieve, Create Draft, Update Draft, Publish,
//  Archive, Restore Draft, Duplicate as Draft, Reorder.
// ============================================================

const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { logActivity, buildSnapshot } = require('../utils/publishingHelper');
const { recordRevision } = require('./adminRevisionController');

/**
 * Get paginated list of resources for Admin Panel (includes drafts & archived).
 */
const getAdminResourceList = (Model, resourceName) => async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;
    const searchQuery = req.query.search;

    const filter = {};
    if (statusFilter && ['draft', 'published', 'archived'].includes(statusFilter)) {
      filter.status = statusFilter;
    }

    if (searchQuery) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { heading: { $regex: searchQuery, $options: 'i' } },
        { fullName: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const total = await Model.countDocuments(filter);
    const items = await Model.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    return sendPaginated(res, `${resourceName} list fetched successfully.`, items, page, limit, total);
  } catch (error) {
    return sendError(res, 500, `Failed to fetch ${resourceName}: ` + error.message);
  }
};

/**
 * Get single resource by ID for Admin Panel.
 */
const getAdminResourceById = (Model, resourceName) => async (req, res) => {
  try {
    const item = await Model.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email');

    if (!item) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    return sendSuccess(res, 200, `${resourceName} details retrieved.`, item);
  } catch (error) {
    return sendError(res, 500, `Error retrieving ${resourceName}: ` + error.message);
  }
};

/**
 * Create new Draft resource.
 */
const createResourceDraft = (Model, resourceName) => async (req, res) => {
  try {
    const inputData = req.body;
    const userId = req.user._id;

    // Get max order value
    const maxOrderDoc = await Model.findOne().sort({ order: -1 }).select('order');
    const nextOrder = maxOrderDoc ? (maxOrderDoc.order || 0) + 1 : 1;

    const draftData = buildSnapshot(inputData);
    draftData.order = inputData.order !== undefined ? inputData.order : nextOrder;

    const doc = new Model({
      ...inputData,
      status: 'draft',
      draftVersion: draftData,
      publishedVersion: null,
      version: 1,
      order: draftData.order,
      createdBy: userId,
      updatedBy: userId,
    });

    await doc.save();

    await recordRevision({
      resourceType: resourceName,
      resourceId: doc._id,
      version: doc.version,
      data: doc.toObject(),
      user: req.user,
      action: 'CREATE_DRAFT',
      summary: `Created new ${resourceName} draft`,
    });

    await logActivity({
      user: req.user,
      action: 'CREATE_DRAFT',
      resource: resourceName,
      resourceId: doc._id,
      summary: `Created new ${resourceName} draft`,
      req,
    });

    return sendSuccess(res, 201, `${resourceName} draft created successfully.`, doc);
  } catch (error) {
    return sendError(res, 400, `Failed to create ${resourceName} draft: ` + error.message);
  }
};

/**
 * Update Draft resource (with optimistic concurrency check).
 */
const updateResourceDraft = (Model, resourceName) => async (req, res) => {
  try {
    const { id } = req.params;
    const inputData = req.body;
    const userId = req.user._id;

    const doc = await Model.findById(id);
    if (!doc) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    // Optimistic locking version check
    if (req.body.version !== undefined && Number(req.body.version) !== doc.version) {
      return sendError(
        res,
        409,
        `Conflict: This ${resourceName} was updated by another administrator. Please reload before saving.`,
        { currentVersion: doc.version, clientVersion: req.body.version }
      );
    }

    const draftData = buildSnapshot({ ...doc.toObject(), ...inputData });

    // Update document fields
    Object.assign(doc, inputData);
    doc.draftVersion = draftData;
    doc.version += 1;
    doc.updatedBy = userId;
    // If it was archived, editing converts status back to draft
    if (doc.status === 'archived') {
      doc.status = 'draft';
    }

    await doc.save();

    await recordRevision({
      resourceType: resourceName,
      resourceId: doc._id,
      version: doc.version,
      data: doc.toObject(),
      user: req.user,
      action: 'UPDATE_DRAFT',
      summary: `Updated ${resourceName} draft (v${doc.version})`,
    });

    await logActivity({
      user: req.user,
      action: 'UPDATE_DRAFT',
      resource: resourceName,
      resourceId: doc._id,
      summary: `Updated ${resourceName} draft (v${doc.version})`,
      req,
    });

    return sendSuccess(res, 200, `${resourceName} draft saved.`, doc);
  } catch (error) {
    return sendError(res, 400, `Failed to update ${resourceName} draft: ` + error.message);
  }
};

/**
 * Publish resource (validates draft and atomically switches publishedVersion).
 */
const publishResource = (Model, resourceName) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const doc = await Model.findById(id);
    if (!doc) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    const snapshotToPublish = buildSnapshot(doc.toObject());

    doc.publishedVersion = snapshotToPublish;
    doc.draftVersion = snapshotToPublish;
    doc.status = 'published';
    doc.version += 1;
    doc.updatedBy = userId;

    await doc.save();

    await recordRevision({
      resourceType: resourceName,
      resourceId: doc._id,
      version: doc.version,
      data: doc.toObject(),
      user: req.user,
      action: 'PUBLISH',
      summary: `Published ${resourceName} version`,
    });

    await logActivity({
      user: req.user,
      action: 'PUBLISH',
      resource: resourceName,
      resourceId: doc._id,
      summary: `Published ${resourceName} version`,
      req,
    });

    return sendSuccess(res, 200, `${resourceName} published successfully.`, doc);
  } catch (error) {
    return sendError(res, 500, `Failed to publish ${resourceName}: ` + error.message);
  }
};

/**
 * Archive resource (removes from public display, preserves database record).
 */
const archiveResource = (Model, resourceName) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const doc = await Model.findById(id);
    if (!doc) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    doc.status = 'archived';
    doc.updatedBy = userId;
    await doc.save();

    await logActivity({
      user: req.user,
      action: 'ARCHIVE',
      resource: resourceName,
      resourceId: doc._id,
      summary: `Archived ${resourceName}`,
      req,
    });

    return sendSuccess(res, 200, `${resourceName} archived successfully.`, doc);
  } catch (error) {
    return sendError(res, 500, `Failed to archive ${resourceName}: ` + error.message);
  }
};

/**
 * Restore archived resource to draft.
 */
const restoreResourceDraft = (Model, resourceName) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const doc = await Model.findById(id);
    if (!doc) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    doc.status = 'draft';
    doc.updatedBy = userId;
    await doc.save();

    await logActivity({
      user: req.user,
      action: 'RESTORE_DRAFT',
      resource: resourceName,
      resourceId: doc._id,
      summary: `Restored ${resourceName} to draft status`,
      req,
    });

    return sendSuccess(res, 200, `${resourceName} restored to draft.`, doc);
  } catch (error) {
    return sendError(res, 500, `Failed to restore ${resourceName}: ` + error.message);
  }
};

/**
 * Duplicate resource as new independent draft.
 */
const duplicateResourceDraft = (Model, resourceName) => async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const existing = await Model.findById(id);
    if (!existing) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    const origObj = existing.toObject();
    delete origObj._id;
    delete origObj.createdAt;
    delete origObj.updatedAt;

    // Append copy suffix
    if (origObj.title) origObj.title = `${origObj.title} (Copy)`;
    if (origObj.heading) origObj.heading = `${origObj.heading} (Copy)`;
    if (origObj.name) origObj.name = `${origObj.name} (Copy)`;

    origObj.status = 'draft';
    origObj.publishedVersion = null;
    origObj.draftVersion = buildSnapshot(origObj);
    origObj.version = 1;
    origObj.createdBy = userId;
    origObj.updatedBy = userId;

    const duplicateDoc = new Model(origObj);
    await duplicateDoc.save();

    await logActivity({
      user: req.user,
      action: 'DUPLICATE',
      resource: resourceName,
      resourceId: duplicateDoc._id,
      summary: `Duplicated ${resourceName} as draft`,
      req,
    });

    return sendSuccess(res, 201, `${resourceName} duplicated as draft.`, duplicateDoc);
  } catch (error) {
    return sendError(res, 500, `Failed to duplicate ${resourceName}: ` + error.message);
  }
};

/**
 * Reorder list of resource IDs.
 */
const reorderResources = (Model, resourceName) => async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, order }
    if (!Array.isArray(items)) {
      return sendError(res, 400, 'Items array containing { id, order } is required.');
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order, updatedBy: req.user._id } },
      },
    }));

    await Model.bulkWrite(bulkOps);

    await logActivity({
      user: req.user,
      action: 'REORDER',
      resource: resourceName,
      summary: `Reordered ${items.length} ${resourceName} items`,
      req,
    });

    return sendSuccess(res, 200, `${resourceName} ordering updated.`);
  } catch (error) {
    return sendError(res, 500, `Failed to reorder ${resourceName}: ` + error.message);
  }
};

/**
 * Permanently delete resource.
 */
const deleteResource = (Model, resourceName) => async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);
    if (!doc) {
      return sendError(res, 404, `${resourceName} record not found.`);
    }

    await logActivity({
      user: req.user,
      action: 'DELETE',
      resource: resourceName,
      resourceId: id,
      summary: `Permanently deleted ${resourceName}`,
      req,
    });

    return sendSuccess(res, 200, `${resourceName} deleted successfully.`);
  } catch (error) {
    return sendError(res, 500, `Failed to delete ${resourceName}: ` + error.message);
  }
};

module.exports = {
  getAdminResourceList,
  getAdminResourceById,
  createResourceDraft,
  updateResourceDraft,
  publishResource,
  archiveResource,
  restoreResourceDraft,
  duplicateResourceDraft,
  reorderResources,
  deleteResource,
};

