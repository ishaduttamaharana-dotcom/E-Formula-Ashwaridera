// ============================================================
//  controllers/contactController.js
//  Handlers for Contact Information CMS (contact_information collection).
// ============================================================

const ContactInfo                        = require('../models/ContactInfo');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

// Helper input validators
const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidUrl = (urlStr) => {
  if (!urlStr || urlStr === '#') return true; // Optional or hashtag placeholder allowed
  try {
    new URL(urlStr);
    return true;
  } catch {
    return false;
  }
};

// ============================================================
//  PUBLIC ENDPOINT
// ============================================================

/**
 * GET /api/v1/contact
 * Retrieve single Contact Information document. Initializes defaults if none exists.
 */
const getContactInfo = async (req, res, next) => {
  try {
    let contact = await ContactInfo.findOne();
    if (!contact) {
      contact = await ContactInfo.create({});
    }
    return sendSuccess(res, 200, 'Contact information retrieved successfully.', contact);
  } catch (error) {
    console.error('getContactInfo Error:', error);
    next(error);
  }
};

// ============================================================
//  ADMIN ENDPOINT (Protected with protect & authorize('admin'))
// ============================================================

/**
 * PUT /api/v1/contact
 * Update contact information document with validation.
 */
const updateContactInfo = async (req, res, next) => {
  try {
    const {
      email, phone, alternatePhone, address, googleMapUrl,
      website, facebook, instagram, linkedin, youtube, twitter, whatsapp, officeHours,
    } = req.body;

    // Validation checks
    if (email !== undefined && !isValidEmail(email.trim())) {
      return sendError(res, 400, 'Invalid email address provided.');
    }

    if (googleMapUrl !== undefined && !isValidUrl(googleMapUrl.trim())) {
      return sendError(res, 400, 'Invalid Google Maps URL provided.');
    }

    if (website !== undefined && !isValidUrl(website.trim())) {
      return sendError(res, 400, 'Invalid website URL provided.');
    }

    if (facebook !== undefined && !isValidUrl(facebook.trim())) {
      return sendError(res, 400, 'Invalid Facebook URL provided.');
    }

    if (instagram !== undefined && !isValidUrl(instagram.trim())) {
      return sendError(res, 400, 'Invalid Instagram URL provided.');
    }

    if (linkedin !== undefined && !isValidUrl(linkedin.trim())) {
      return sendError(res, 400, 'Invalid LinkedIn URL provided.');
    }

    if (youtube !== undefined && !isValidUrl(youtube.trim())) {
      return sendError(res, 400, 'Invalid YouTube URL provided.');
    }

    if (twitter !== undefined && !isValidUrl(twitter.trim())) {
      return sendError(res, 400, 'Invalid Twitter/X URL provided.');
    }

    let contact = await ContactInfo.findOne();
    if (!contact) {
      contact = new ContactInfo({});
    }

    if (email !== undefined)          contact.email          = email.trim();
    if (phone !== undefined)          contact.phone          = phone.trim();
    if (alternatePhone !== undefined) contact.alternatePhone = alternatePhone.trim();
    if (address !== undefined)        contact.address        = address.trim();
    if (googleMapUrl !== undefined)   contact.googleMapUrl   = googleMapUrl.trim();
    if (website !== undefined)        contact.website        = website.trim();
    if (facebook !== undefined)       contact.facebook       = facebook.trim();
    if (instagram !== undefined)      contact.instagram      = instagram.trim();
    if (linkedin !== undefined)       contact.linkedin       = linkedin.trim();
    if (youtube !== undefined)        contact.youtube        = youtube.trim();
    if (twitter !== undefined)        contact.twitter        = twitter.trim();
    if (whatsapp !== undefined)       contact.whatsapp       = whatsapp.trim();
    if (officeHours !== undefined)    contact.officeHours    = officeHours.trim();

    await contact.save();

    return sendSuccess(res, 200, 'Contact information updated successfully.', contact);
  } catch (error) {
    console.error('updateContactInfo Error:', error);
    next(error);
  }
};

module.exports = {
  getContactInfo,
  updateContactInfo,
};
