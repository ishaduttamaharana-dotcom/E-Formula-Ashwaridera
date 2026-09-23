// ============================================================
//  controllers/adminInboxController.js
//  Admin Controller for Contact Messages, Recruitment Applications,
//  and Corporate Sponsor Requests.
// ============================================================

const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const ContactMessage = require('../models/ContactMessage');
const JoinApplication = require('../models/JoinApplication');
const SponsorRequest = require('../models/SponsorRequest');

// ─── 1. CONTACT MESSAGES ────────────────────────────────────
const getContactMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;

    const filter = {};
    if (statusFilter) filter.status = statusFilter;

    const total = await ContactMessage.countDocuments(filter);
    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendPaginated(res, 'Contact messages fetched successfully.', messages, page, limit, total);
  } catch (err) {
    return sendError(res, 500, 'Error fetching contact messages: ' + err.message);
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const msg = await ContactMessage.findById(id);
    if (!msg) return sendError(res, 404, 'Contact message not found.');

    if (status && ['new', 'read', 'in_progress', 'closed', 'archived'].includes(status)) {
      msg.status = status;
      if (status === 'read' && !msg.readAt) msg.readAt = new Date();
    }
    if (adminNotes !== undefined) msg.adminNotes = adminNotes;

    await msg.save();
    await logActivity({ user: req.user, action: 'STATUS_UPDATE', resource: 'ContactMessage', resourceId: id, summary: `Updated message status to ${msg.status}`, req });

    return sendSuccess(res, 200, 'Contact message updated.', msg);
  } catch (err) {
    return sendError(res, 500, 'Error updating message status: ' + err.message);
  }
};

const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findByIdAndDelete(id);
    if (!msg) return sendError(res, 404, 'Contact message not found.');

    await logActivity({ user: req.user, action: 'DELETE', resource: 'ContactMessage', resourceId: id, summary: 'Deleted contact message', req });
    return sendSuccess(res, 200, 'Contact message deleted.');
  } catch (err) {
    return sendError(res, 500, 'Error deleting contact message: ' + err.message);
  }
};

// ─── 2. RECRUITMENT APPLICATIONS ────────────────────────────
const getJoinApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;

    const filter = {};
    if (statusFilter) filter.status = statusFilter;

    const total = await JoinApplication.countDocuments(filter);
    const apps = await JoinApplication.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendPaginated(res, 'Join applications fetched.', apps, page, limit, total);
  } catch (err) {
    console.error('getJoinApplications Error:', err);
    return sendError(res, 500, 'Error fetching applications: ' + err.message);
  }
};

const updateJoinApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const appDoc = await JoinApplication.findById(id);
    if (!appDoc) return sendError(res, 404, 'Application not found.');

    if (status) {
      if (!['Pending', 'Under Review', 'Accepted', 'Rejected'].includes(status)) {
        return sendError(res, 400, 'Invalid application status value. Must be Pending, Under Review, Accepted, or Rejected.');
      }
      appDoc.status = status;
    }
    if (adminNotes !== undefined) appDoc.adminNotes = adminNotes;

    await appDoc.save();
    await logActivity({ user: req.user, action: 'STATUS_UPDATE', resource: 'JoinApplication', resourceId: id, summary: `Updated application status to ${appDoc.status}`, req });

    return sendSuccess(res, 200, 'Application status updated.', appDoc);
  } catch (err) {
    console.error('updateJoinApplicationStatus Error:', err);
    return sendError(res, 500, 'Error updating application: ' + err.message);
  }
};

// ─── 3. SPONSOR REQUESTS ────────────────────────────────────
const getSponsorRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const statusFilter = req.query.status;

    const filter = {};
    if (statusFilter) filter.status = statusFilter;

    const total = await SponsorRequest.countDocuments(filter);
    const reqs = await SponsorRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendPaginated(res, 'Sponsor requests fetched.', reqs, page, limit, total);
  } catch (err) {
    console.error('getSponsorRequests Error:', err);
    return sendError(res, 500, 'Error fetching sponsor requests: ' + err.message);
  }
};

const updateSponsorRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const sponsorReq = await SponsorRequest.findById(id);
    if (!sponsorReq) return sendError(res, 404, 'Sponsor request not found.');

    if (status) {
      if (!['Pending', 'Under Review', 'Accepted', 'Rejected'].includes(status)) {
        return sendError(res, 400, 'Invalid sponsor request status value. Must be Pending, Under Review, Accepted, or Rejected.');
      }
      sponsorReq.status = status;
    }
    if (adminNotes !== undefined) sponsorReq.adminNotes = adminNotes;

    await sponsorReq.save();
    await logActivity({ user: req.user, action: 'STATUS_UPDATE', resource: 'SponsorRequest', resourceId: id, summary: `Updated sponsor request status to ${sponsorReq.status}`, req });

    return sendSuccess(res, 200, 'Sponsor request updated.', sponsorReq);
  } catch (err) {
    console.error('updateSponsorRequestStatus Error:', err);
    return sendError(res, 500, 'Error updating sponsor request: ' + err.message);
  }
};

// ─── 4. LIVE INBOX BADGE COUNTERS ───────────────────────────
const getInboxCounts = async (req, res) => {
  try {
    const [newMessages, pendingJoinApps, pendingSponsorReqs] = await Promise.all([
      ContactMessage.countDocuments({ status: { $regex: /^new$/i } }),
      JoinApplication.countDocuments({ status: { $regex: /^pending$/i } }),
      SponsorRequest.countDocuments({ status: { $regex: /^pending$/i } }),
    ]);

    return sendSuccess(res, 200, 'Inbox counts retrieved.', {
      newContactMessages: newMessages,
      pendingJoinApplications: pendingJoinApps,
      pendingSponsorRequests: pendingSponsorReqs,
      totalUnreadItems: newMessages + pendingJoinApps + pendingSponsorReqs,
    });
  } catch (err) {
    console.error('getInboxCounts Error:', err);
    return sendError(res, 500, 'Error calculating inbox counts: ' + err.message);
  }
};

module.exports = {
  getContactMessages,
  updateMessageStatus,
  deleteContactMessage,
  getJoinApplications,
  updateJoinApplicationStatus,
  getSponsorRequests,
  updateSponsorRequestStatus,
  getInboxCounts,
};
