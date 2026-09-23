// ============================================================
//  controllers/sponsorController.js
//  Handlers for Sponsor Applications (sponsor_requests collection).
// ============================================================

const SponsorRequest                     = require('../models/SponsorRequest');
const {
  uploadBufferToCloudinary,
  uploadRawToCloudinary,
  deleteFromCloudinary,
} = require('../services/cloudinaryService');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

/**
 * POST /api/v1/sponsors
 * Submit a Sponsor Request (Logged-in user only).
 * Handles optional company logo image & optional proposal document (PDF/DOC/DOCX).
 */
const submitSponsorRequest = async (req, res, next) => {
  try {
    const {
      companyName, industry, website, contactPerson, designation,
      email, phone, sponsorshipType, sponsorshipAmount, expectedCollaboration, message,
    } = req.body;

    if (!companyName || !companyName.trim()) {
      return sendError(res, 400, 'Company or organization name is required.');
    }
    if (!contactPerson || !contactPerson.trim()) {
      return sendError(res, 400, 'Contact person name is required.');
    }
    if (!email || !email.trim()) {
      return sendError(res, 400, 'Email address is required.');
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }
    if (!phone || !phone.trim()) {
      return sendError(res, 400, 'Phone number is required.');
    }
    if (!sponsorshipType || !sponsorshipType.trim()) {
      return sendError(res, 400, 'Sponsorship type is required.');
    }

    let companyLogoUrl = '';
    let companyLogoPublicId = '';
    let documentUrl = '';
    let documentPublicId = '';

    // Handle uploaded files (req.files containing logo & document arrays)
    if (req.files) {
      if (req.files.logo && req.files.logo.length > 0) {
        const logoFile = req.files.logo[0];
        const uploadResult = await uploadBufferToCloudinary(logoFile.buffer, 'ashwa_sponsors');
        companyLogoUrl = uploadResult.url;
        companyLogoPublicId = uploadResult.publicId;
      }

      if (req.files.document && req.files.document.length > 0) {
        const docFile = req.files.document[0];
        const uploadResult = await uploadRawToCloudinary(docFile.buffer, 'ashwa_sponsor_docs');
        documentUrl = uploadResult.url;
        documentPublicId = uploadResult.publicId;
      }
    }

    const sponsorReq = await SponsorRequest.create({
      userId: req.user ? req.user._id : null,
      companyName: companyName.trim(),
      industry: industry ? industry.trim() : '',
      website: website ? website.trim() : '',
      contactPerson: contactPerson.trim(),
      designation: designation ? designation.trim() : '',
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      sponsorshipType: sponsorshipType.trim(),
      sponsorshipAmount: sponsorshipAmount ? sponsorshipAmount.trim() : '',
      expectedCollaboration: expectedCollaboration ? expectedCollaboration.trim() : '',
      message: message ? message.trim() : '',
      companyLogoUrl,
      companyLogoPublicId,
      documentUrl,
      documentPublicId,
      status: 'Pending',
    });

    return sendSuccess(res, 201, 'Your sponsorship request has been submitted successfully.', sponsorReq);
  } catch (error) {
    console.error('submitSponsorRequest Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/sponsors/my-request
 * Retrieve sponsor requests submitted by the logged-in user.
 */
const getMySponsorRequests = async (req, res, next) => {
  try {
    const requests = await SponsorRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Your sponsor requests retrieved successfully.', requests);
  } catch (error) {
    console.error('getMySponsorRequests Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/sponsors
 * Retrieve all sponsor requests (Admin only) with search & filter.
 */
const getAllSponsorRequests = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { companyName: new RegExp(search, 'i') },
        { contactPerson: new RegExp(search, 'i') },
        { sponsorshipType: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const requests = await SponsorRequest.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'All sponsor requests retrieved successfully.', requests);
  } catch (error) {
    console.error('getAllSponsorRequests Error:', error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/sponsors/:id/status
 * Update sponsor request status (Admin only).
 */
const updateSponsorStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Under Review', 'Accepted', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Invalid status value. Must be Pending, Under Review, Accepted, or Rejected.');
    }

    const request = await SponsorRequest.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!request) return sendError(res, 404, 'Sponsor request not found.');

    return sendSuccess(res, 200, `Sponsor request status updated to ${status}.`, request);
  } catch (error) {
    console.error('updateSponsorStatus Error:', error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/sponsors/:id
 * Delete sponsor request document and clean up Cloudinary assets (Admin only).
 */
const deleteSponsorRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await SponsorRequest.findById(id);
    if (!request) return sendError(res, 404, 'Sponsor request not found.');

    if (request.companyLogoPublicId) {
      try {
        await deleteFromCloudinary(request.companyLogoPublicId, 'image');
      } catch (cErr) {
        console.warn('Failed to delete company logo from Cloudinary:', cErr.message);
      }
    }

    if (request.documentPublicId) {
      try {
        await deleteFromCloudinary(request.documentPublicId, 'raw');
      } catch (cErr) {
        console.warn('Failed to delete proposal document from Cloudinary:', cErr.message);
      }
    }

    await request.deleteOne();

    return sendSuccess(res, 200, 'Sponsor request deleted successfully.');
  } catch (error) {
    console.error('deleteSponsorRequest Error:', error);
    next(error);
  }
};

module.exports = {
  submitSponsorRequest,
  getMySponsorRequests,
  getAllSponsorRequests,
  updateSponsorStatus,
  deleteSponsorRequest,
};
