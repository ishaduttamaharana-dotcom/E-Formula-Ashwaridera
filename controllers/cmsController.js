// ============================================================
//  controllers/cmsController.js
//  Handlers for generic CMS content management & Cloudinary uploads.
//  Uses CmsContent model (collection: 'cms_contents').
// ============================================================

const CmsContent = require('../models/CmsContent');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// ============================================================
//  PUBLIC ENDPOINTS
//  GET /api/v1/cms/content
//  GET /api/v1/cms/content/:section
// ============================================================
const getContent = async (req, res, next) => {
  try {
    const section = req.params.section || req.query.section;
    const filter  = { isActive: true };

    if (section) {
      filter.section = section;
    }

    const items = await CmsContent.find(filter).sort({ order: 1, createdAt: 1 });

    return sendSuccess(res, 200, 'CMS content retrieved successfully.', items);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  ADMIN ENDPOINTS (Protected with protect & authorize('admin'))
// ============================================================

/**
 * POST /api/v1/cms/content
 * Create a new CMS record in 'cms_contents' collection.
 */
const createContent = async (req, res, next) => {
  try {
    const { section = 'general', key, title, description, imageUrl, image, publicId, buttonText, buttonLink, order, meta } = req.body;

    const imgUrl = imageUrl || (image && image.url) || '';
    const pId    = publicId || (image && image.publicId) || '';

    const doc = await CmsContent.create({
      section:     section.trim(),
      key:         key ? key.trim() : null,
      title:       title ? title.trim() : '',
      description: description ? description.trim() : '',
      imageUrl:    imgUrl,
      publicId:    pId,
      buttonText:  buttonText ? buttonText.trim() : '',
      buttonLink:  buttonLink ? buttonLink.trim() : '',
      order:       order !== undefined ? Number(order) : 0,
      meta:        meta || {},
    });

    return sendSuccess(res, 201, 'CMS content record created successfully.', doc);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/cms/content/:id
 * Update an existing CMS content record.
 */
const updateContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { section, key, title, description, imageUrl, image, publicId, buttonText, buttonLink, order, meta, isActive } = req.body;

    const updates = {};
    if (section !== undefined)     updates.section     = section.trim();
    if (key !== undefined)         updates.key         = key ? key.trim() : null;
    if (title !== undefined)       updates.title       = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (imageUrl !== undefined)    updates.imageUrl    = imageUrl;
    if (image && image.url)        updates.imageUrl    = image.url;
    if (publicId !== undefined)    updates.publicId    = publicId;
    if (image && image.publicId)   updates.publicId    = image.publicId;
    if (buttonText !== undefined)  updates.buttonText  = buttonText.trim();
    if (buttonLink !== undefined)  updates.buttonLink  = buttonLink.trim();
    if (order !== undefined)       updates.order       = Number(order);
    if (meta !== undefined)        updates.meta        = meta;
    if (isActive !== undefined)    updates.isActive    = Boolean(isActive);

    const updated = await CmsContent.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return sendError(res, 404, 'CMS record not found.');
    }

    return sendSuccess(res, 200, 'CMS record updated successfully.', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/cms/content/:id
 * Delete a CMS content record (and clean up Cloudinary asset if publicId exists).
 */
const deleteContent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await CmsContent.findById(id);
    if (!doc) {
      return sendError(res, 404, 'CMS record not found.');
    }

    // Clean up Cloudinary asset if publicId exists
    if (doc.publicId) {
      try {
        await deleteFromCloudinary(doc.publicId);
      } catch (cloudErr) {
        console.warn('Failed to delete asset from Cloudinary:', cloudErr.message);
      }
    }

    await doc.deleteOne();

    return sendSuccess(res, 200, 'CMS record deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/cms/upload
 * Upload image to Cloudinary and return { imageUrl, publicId }.
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please select an image file to upload.');
    }

    const folder = req.body.folder || 'ashwa_cms';
    const result = await uploadBufferToCloudinary(req.file.buffer, folder);

    return sendSuccess(res, 200, 'Image uploaded successfully to Cloudinary.', {
      imageUrl: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    return sendError(res, 500, `Image upload failed: ${error.message}`);
  }
};

module.exports = {
  getContent,
  createContent,
  updateContent,
  deleteContent,
  uploadImage,
};
