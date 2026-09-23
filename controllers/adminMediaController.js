// ============================================================
//  controllers/adminMediaController.js
//  Protected Admin Media Library API Controller.
//  Endpoints for uploading, listing, detailing, updating, and deleting
//  MediaAsset documents with Cloudinary synchronization and usage tracking.
// ============================================================

const MediaAsset = require('../models/MediaAsset');
const HeroSlide = require('../models/HeroSlide');
const NewsArticle = require('../models/NewsArticle');
const GalleryImage = require('../models/GalleryImage');
const TeamMember = require('../models/TeamMember');
const Sponsor = require('../models/Sponsor');
const {
  uploadBufferToCloudinary,
  uploadVideoToCloudinary,
  uploadRawToCloudinary,
  deleteFromCloudinary,
} = require('../services/cloudinaryService');
const { generateUploadSignature } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * GET /api/v1/admin/media
 * Fetch paginated media assets with search, type filter, tag filter.
 */
const getMediaAssets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 24));
    const skip = (page - 1) * limit;

    const filter = { isPrivate: false }; // Never display private application attachments in public media library

    if (req.query.type && req.query.type !== 'all') {
      filter.resourceType = req.query.type.toLowerCase();
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { publicId: searchRegex },
        { altText: searchRegex },
        { caption: searchRegex },
        { tags: searchRegex },
        { url: searchRegex },
      ];
    }

    if (req.query.tag) {
      filter.tags = req.query.tag.trim();
    }

    const [items, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'fullName email'),
      MediaAsset.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, 'Media assets retrieved successfully.', items, {
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/media/upload
 * Upload media file (image/video/document) to Cloudinary and create MediaAsset record.
 */
const uploadMediaAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No file provided for upload.');
    }

    const mimetype = req.file.mimetype || '';
    const originalname = req.file.originalname || 'file';
    let resourceType = 'image';
    let folder = 'ashwa_cms/images';

    if (mimetype.startsWith('video/')) {
      resourceType = 'video';
      folder = 'ashwa_cms/videos';
    } else if (mimetype.includes('pdf') || mimetype.includes('word') || mimetype.includes('document')) {
      resourceType = 'raw';
      folder = 'ashwa_cms/documents';
    }

    let uploadResult;
    try {
      if (resourceType === 'video') {
        uploadResult = await uploadVideoToCloudinary(req.file.buffer, folder);
      } else if (resourceType === 'raw') {
        uploadResult = await uploadRawToCloudinary(req.file.buffer, folder);
      } else {
        uploadResult = await uploadBufferToCloudinary(req.file.buffer, folder);
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload warning:', cloudErr.message);
      // Fallback for local development if Cloudinary credentials are missing
      const dummyId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      uploadResult = {
        url: `https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80`,
        publicId: dummyId,
      };
    }

    const altText = req.body.altText || originalname.replace(/\.[^/.]+$/, '');
    const caption = req.body.caption || '';
    const tags = req.body.tags
      ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const asset = await MediaAsset.create({
      publicId: uploadResult.publicId,
      url: uploadResult.url,
      secureUrl: uploadResult.url,
      resourceType,
      format: originalname.split('.').pop().toLowerCase(),
      bytes: req.file.size || 0,
      width: uploadResult.width || 0,
      height: uploadResult.height || 0,
      altText,
      caption,
      tags,
      isPrivate: false,
      uploadedBy: req.user ? req.user._id : null,
    });

    return sendSuccess(res, 201, 'Media asset uploaded successfully.', asset);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/media/:id
 * Get single media asset details with usage references.
 */
const getMediaAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await MediaAsset.findById(id).populate('uploadedBy', 'fullName email');

    if (!asset) {
      return sendError(res, 404, 'Media asset not found.');
    }

    // Calculate usage across active models
    const usages = [];
    const urlPattern = asset.url;
    const publicIdPattern = asset.publicId;

    const [heroCount, newsCount, galleryCount, teamCount, sponsorCount] = await Promise.all([
      HeroSlide.countDocuments({
        $or: [
          { videoUrl: urlPattern },
          { imageUrl: urlPattern },
          { mobileImageUrl: urlPattern },
          { 'draftVersion.videoUrl': urlPattern },
          { 'draftVersion.imageUrl': urlPattern },
        ],
      }),
      NewsArticle.countDocuments({
        $or: [
          { imageUrl: urlPattern },
          { 'draftVersion.imageUrl': urlPattern },
        ],
      }),
      GalleryImage.countDocuments({
        $or: [
          { imageUrl: urlPattern },
          { publicId: publicIdPattern },
        ],
      }),
      TeamMember.countDocuments({
        $or: [
          { photoUrl: urlPattern },
        ],
      }),
      Sponsor.countDocuments({
        $or: [
          { logoUrl: urlPattern },
        ],
      }),
    ]);

    if (heroCount > 0) usages.push({ model: 'HeroSlide', count: heroCount });
    if (newsCount > 0) usages.push({ model: 'NewsArticle', count: newsCount });
    if (galleryCount > 0) usages.push({ model: 'GalleryImage', count: galleryCount });
    if (teamCount > 0) usages.push({ model: 'TeamMember', count: teamCount });
    if (sponsorCount > 0) usages.push({ model: 'Sponsor', count: sponsorCount });

    const totalUsages = usages.reduce((acc, u) => acc + u.count, 0);
    asset.referenceCount = totalUsages;
    await asset.save();

    return sendSuccess(res, 200, 'Media asset retrieved.', {
      asset,
      usages,
      isReferenced: totalUsages > 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/media/:id
 * Update metadata (altText, caption, tags) on MediaAsset.
 */
const updateMediaAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { altText, caption, tags } = req.body;

    const updates = {};
    if (altText !== undefined) updates.altText = altText.trim();
    if (caption !== undefined) updates.caption = caption.trim();
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const updated = await MediaAsset.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return sendError(res, 404, 'Media asset not found.');
    }

    return sendSuccess(res, 200, 'Media asset metadata updated successfully.', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/media/:id
 * Permanently delete media asset from Cloudinary & DB if not referenced by active content.
 */
const deleteMediaAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await MediaAsset.findById(id);

    if (!asset) {
      return sendError(res, 404, 'Media asset not found.');
    }

    // Safety check: ensure asset is not referenced
    const urlPattern = asset.url;
    const heroCount = await HeroSlide.countDocuments({
      $or: [{ videoUrl: urlPattern }, { imageUrl: urlPattern }],
    });
    const newsCount = await NewsArticle.countDocuments({ imageUrl: urlPattern });

    if (heroCount > 0 || newsCount > 0 || asset.referenceCount > 0) {
      return sendError(
        res,
        400,
        `Cannot delete media asset because it is currently referenced by active content records.`
      );
    }

    // Try deleting from Cloudinary
    if (asset.publicId && !asset.publicId.startsWith('local_')) {
      try {
        await deleteFromCloudinary(asset.publicId, asset.resourceType);
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    await asset.deleteOne();
    return sendSuccess(res, 200, 'Media asset deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/media/signature
 * Returns signed upload parameters for direct client-to-Cloudinary upload.
 * Completely eliminates Vercel 4.5MB serverless body limit for videos & large images.
 */
const getUploadSignature = async (req, res, next) => {
  try {
    const folder = req.query.folder || 'ashwa_cms';
    const sigData = generateUploadSignature(folder);
    if (!sigData) {
      return sendError(res, 503, 'Cloudinary credentials are not configured on this server.');
    }
    return sendSuccess(res, 200, 'Upload signature generated successfully.', sigData);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/media/direct-record
 * Records metadata for an asset uploaded directly to Cloudinary by the client.
 */
const createMediaAssetFromDirectUpload = async (req, res, next) => {
  try {
    const {
      publicId,
      url,
      secureUrl,
      resourceType = 'image',
      format = '',
      bytes = 0,
      width = 0,
      height = 0,
      altText = '',
      caption = '',
      tags = [],
    } = req.body;

    if (!url || !publicId) {
      return sendError(res, 400, 'Missing required asset url or publicId.');
    }

    const asset = await MediaAsset.create({
      publicId,
      url,
      secureUrl: secureUrl || url,
      resourceType,
      format,
      bytes,
      width,
      height,
      altText: altText || publicId,
      caption,
      tags: Array.isArray(tags) ? tags : [],
      isPrivate: false,
      uploadedBy: req.user ? req.user._id : null,
    });

    return sendSuccess(res, 201, 'Media asset record created successfully.', asset);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMediaAssets,
  uploadMediaAsset,
  getMediaAssetById,
  updateMediaAsset,
  deleteMediaAsset,
  getUploadSignature,
  createMediaAssetFromDirectUpload,
};

