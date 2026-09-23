// ============================================================
//  controllers/adminActivityController.js
//  Audit log query controller for admin activity screen.
// ============================================================

const ActivityLog = require('../models/ActivityLog');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * GET /api/v1/admin/activity
 * Retrieve audit log events with filtering & pagination
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { resource, action, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (resource) filter.resource = resource;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'fullName email role');

    const total = await ActivityLog.countDocuments(filter);

    return sendSuccess(res, 200, 'Activity log retrieved successfully.', logs, {
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

module.exports = {
  getActivityLogs,
};
