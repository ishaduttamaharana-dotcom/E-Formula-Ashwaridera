// ============================================================
//  controllers/adminMediaController.js
//  Complete Protected Admin Media Library API Controller.
//  Handles direct-signed uploads, server stream uploads, verification,
//  CMS cross-referencing, safe deletion, and health audits.
// ============================================================

const MediaAsset = require('../models/MediaAsset');
const HomePageContent = require('../models/HomePageContent');
const NavFooterSettings = require('../models/NavFooterSettings');
const CarPageContent = require('../models/CarPageContent');
const AboutContent = require('../models/AboutContent');
const AchievementsPageContent = require('../models/AchievementsPageContent');
const Achievement = require('../models/Achievement');
const HeroSlide = require('../models/HeroSlide');
const NewsArticle = require('../models/NewsArticle');
const GalleryImage = require('../models/GalleryImage');
const TeamMember = require('../models/TeamMember');
const Sponsor = require('../models/Sponsor');

const {
  uploadBufferToCloudinary,
  uploadVideoToCloudinary,
  uploadRawToCloudinary,
  verifyCloudinaryAsset,
  deleteFromCloudinary,
} = require('../services/cloudinaryService');
const { generateUploadSignature, getCloudinaryConfig } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * Calculates references for a given media URL or publicId across all CMS collections.
 *
 * @param {string} url
 * @param {string} publicId
 * @returns {Promise<{ totalCount: number, details: Array<{ collection: string, count: number, label: string }> }>}
 */
const calculateAssetUsages = async (url, publicId = '') => {
  const usages = [];
  if (!url && !publicId) return { totalCount: 0, details: usages };

  const urlPattern = url ? new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  const publicIdPattern = publicId ? new RegExp(publicId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

  const orQueries = [];
  if (urlPattern) orQueries.push({ urlPattern });
  if (publicIdPattern) orQueries.push({ publicIdPattern });

  const [
    heroCount,
    newsCount,
    galleryCount,
    teamCount,
    sponsorCount,
    achievementCount,
    homeCount,
    navCount,
    carCount,
    aboutCount,
  ] = await Promise.all([
    HeroSlide.countDocuments({
      $or: [
        { videoUrl: url },
        { imageUrl: url },
        { mobileImageUrl: url },
        { 'draftVersion.videoUrl': url },
        { 'draftVersion.imageUrl': url },
      ],
    }),
    NewsArticle.countDocuments({
      $or: [{ imageUrl: url }, { 'draftVersion.imageUrl': url }],
    }),
    GalleryImage.countDocuments({
      $or: [
        { imageUrl: url },
        { videoUrl: url },
        { thumbnailUrl: url },
        { publicId: publicId },
      ],
    }),
    TeamMember.countDocuments({
      $or: [{ photoUrl: url }, { imageUrl: url }],
    }),
    Sponsor.countDocuments({
      $or: [{ logoUrl: url }, { companyLogoUrl: url }],
    }),
    Achievement.countDocuments({
      $or: [{ imageUrl: url }, { trophyImageUrl: url }],
    }),
    HomePageContent.countDocuments({
      $or: [
        { 'hero.videoUrl': url },
        { 'hero.fallbackImage': url },
        { 'garage.items.image': url },
        { 'footerSponsors.sponsorSection.tiers.sponsors.logoUrl': url },
        { 'news.items.imageUrl': url },
      ],
    }),
    NavFooterSettings.countDocuments({
      $or: [
        { 'navbar.logo': url },
        { 'footer.logo': url },
        { 'footer.brandMarkUrl': url },
        { 'footer.sponsorLogos.url': url },
      ],
    }),
    CarPageContent.countDocuments({
      $or: [
        { 'hero.backgroundImage': url },
        { 'gallery.images': url },
        { 'gallery.items.url': url },
      ],
    }),
    AboutContent.countDocuments({
      $or: [
        { 'mission.image': url },
        { 'history.image': url },
        { 'vehicle.image': url },
        { 'team.image': url },
      ],
    }),
  ]);

  if (heroCount > 0) usages.push({ collection: 'HeroSlide', count: heroCount, label: 'Hero Slides' });
  if (newsCount > 0) usages.push({ collection: 'NewsArticle', count: newsCount, label: 'News Articles' });
  if (galleryCount > 0) usages.push({ collection: 'GalleryImage', count: galleryCount, label: 'Gallery Media' });
  if (teamCount > 0) usages.push({ collection: 'TeamMember', count: teamCount, label: 'Team Members' });
  if (sponsorCount > 0) usages.push({ collection: 'Sponsor', count: sponsorCount, label: 'Sponsors' });
  if (achievementCount > 0) usages.push({ collection: 'Achievement', count: achievementCount, label: 'Achievements' });
  if (homeCount > 0) usages.push({ collection: 'HomePageContent', count: homeCount, label: 'Home Page Control Center' });
  if (navCount > 0) usages.push({ collection: 'NavFooterSettings', count: navCount, label: 'Navigation & Footer' });
  if (carCount > 0) usages.push({ collection: 'CarPageContent', count: carCount, label: 'Car Showcase Page' });
  if (aboutCount > 0) usages.push({ collection: 'AboutContent', count: aboutCount, label: 'About Page' });

  const totalCount = usages.reduce((acc, u) => acc + u.count, 0);
  return { totalCount, details: usages };
};

/**
 * GET /api/v1/admin/media
 * Fetch paginated media assets with search, type filter, tag filter.
 */
const getMediaAssets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 24));
    const skip = (page - 1) * limit;

    const filter = { isPrivate: false };

    if (req.query.type && req.query.type !== 'all') {
      const typeStr = req.query.type.toLowerCase();
      if (typeStr === 'document' || typeStr === 'raw') {
        filter.resourceType = 'raw';
      } else {
        filter.resourceType = typeStr;
      }
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      filter.$or = [
        { publicId: searchRegex },
        { altText: searchRegex },
        { caption: searchRegex },
        { tags: searchRegex },
        { url: searchRegex },
        { originalName: searchRegex },
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
 * Verifies that the asset actually exists in storage before creating the database record.
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
      duration = 0,
      altText = '',
      caption = '',
      tags = [],
      folder = 'ashwa_cms',
      category = 'general',
      originalName = '',
      mimeType = '',
    } = req.body;

    if (!url || !publicId) {
      return sendError(res, 400, 'Missing required asset url or publicId.');
    }

    // Verify asset exists in storage
    const targetUrl = secureUrl || url;
    const verification = await verifyCloudinaryAsset(publicId, resourceType, targetUrl);
    if (!verification.exists) {
      return sendError(
        res,
        400,
        `Asset verification failed: file does not exist in Cloudinary storage (${verification.error || 'unreachable'}).`
      );
    }

    // Check if record already exists for this publicId (idempotent)
    let asset = await MediaAsset.findOne({ publicId });
    if (asset) {
      asset.url = targetUrl;
      asset.secureUrl = targetUrl;
      asset.altText = altText || asset.altText;
      asset.caption = caption || asset.caption;
      asset.bytes = bytes || asset.bytes;
      asset.width = width || asset.width;
      asset.height = height || asset.height;
      asset.duration = duration || asset.duration;
      await asset.save();
      return sendSuccess(res, 200, 'Media asset record updated successfully.', asset);
    }

    asset = await MediaAsset.create({
      publicId,
      storageKey: publicId,
      url: targetUrl,
      secureUrl: targetUrl,
      filename: originalName || publicId.split('/').pop(),
      originalName: originalName || publicId.split('/').pop(),
      mimeType: mimeType || (resourceType === 'video' ? 'video/mp4' : 'image/jpeg'),
      resourceType,
      mediaType: resourceType === 'video' ? 'video' : resourceType === 'raw' ? 'document' : 'image',
      format: format || (targetUrl.split('.').pop() || '').toLowerCase(),
      bytes: bytes || 0,
      size: bytes || 0,
      width: width || 0,
      height: height || 0,
      duration: duration || 0,
      folder,
      category,
      altText: altText || originalName || publicId,
      caption,
      tags: Array.isArray(tags) ? tags : [],
      isPrivate: false,
      uploadedBy: req.user ? req.user._id : null,
    });

    return sendSuccess(res, 201, 'Media asset record created and verified successfully.', asset);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/media/upload
 * Server-stream upload fallback for files under 4.5MB.
 * No dummy stock photos: throws real errors if upload fails.
 */
const uploadMediaAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No file provided for upload.');
    }

    const mimetype = req.file.mimetype || '';
    const originalname = req.file.originalname || 'file';
    let resourceType = 'image';
    let folder = req.body.folder || 'ashwa_cms/images';

    if (mimetype.startsWith('video/')) {
      resourceType = 'video';
      folder = req.body.folder || 'ashwa_cms/videos';
    } else if (
      mimetype.includes('pdf') ||
      mimetype.includes('word') ||
      mimetype.includes('document') ||
      originalname.match(/\.(pdf|doc|docx)$/i)
    ) {
      resourceType = 'raw';
      folder = req.body.folder || 'ashwa_cms/documents';
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
      console.error('Cloudinary upload failure:', cloudErr);
      return sendError(
        res,
        500,
        `Storage upload failed: ${cloudErr.message || 'Unable to store file in Cloudinary.'}`
      );
    }

    // Verify storage returned a valid URL
    if (!uploadResult || (!uploadResult.url && !uploadResult.secureUrl)) {
      return sendError(res, 502, 'Storage provider returned an invalid empty media URL.');
    }

    const altText = req.body.altText || originalname.replace(/\.[^/.]+$/, '');
    const caption = req.body.caption || '';
    const tags = req.body.tags
      ? req.body.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const asset = await MediaAsset.create({
      publicId: uploadResult.publicId,
      storageKey: uploadResult.publicId,
      url: uploadResult.secureUrl || uploadResult.url,
      secureUrl: uploadResult.secureUrl || uploadResult.url,
      filename: originalname,
      originalName: originalname,
      mimeType: mimetype,
      resourceType,
      mediaType: resourceType === 'video' ? 'video' : resourceType === 'raw' ? 'document' : 'image',
      format: uploadResult.format || originalname.split('.').pop().toLowerCase(),
      bytes: uploadResult.bytes || req.file.size || 0,
      size: uploadResult.bytes || req.file.size || 0,
      width: uploadResult.width || 0,
      height: uploadResult.height || 0,
      duration: uploadResult.duration || 0,
      folder,
      category: req.body.category || 'general',
      altText,
      caption,
      tags,
      isPrivate: false,
      uploadedBy: req.user ? req.user._id : null,
    });

    return sendSuccess(res, 201, 'Media asset uploaded and verified successfully.', asset);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/media/verify
 * Tests whether a given media URL or publicId is live and accessible.
 */
const verifyMediaEndpoint = async (req, res, next) => {
  try {
    const { url, publicId, resourceType = 'image' } = req.body;
    if (!url && !publicId) {
      return sendError(res, 400, 'Provide a url or publicId to verify.');
    }

    let exists = false;
    let details = {};

    if (publicId) {
      const v = await verifyCloudinaryAsset(publicId, resourceType, url);
      exists = v.exists;
      details = v.details || { error: v.error };
    } else if (url) {
      try {
        const head = await fetch(url, { method: 'HEAD' });
        exists = head.ok;
        details = { status: head.status, contentType: head.headers.get('content-type') };
      } catch (err) {
        exists = false;
        details = { error: err.message };
      }
    }

    return sendSuccess(res, 200, exists ? 'Media asset verified live.' : 'Media asset unreachable.', {
      exists,
      url,
      publicId,
      details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/media/:id
 * Get single media asset details with live usage references.
 */
const getMediaAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await MediaAsset.findById(id).populate('uploadedBy', 'fullName email');

    if (!asset) {
      return sendError(res, 404, 'Media asset not found.');
    }

    const { totalCount, details } = await calculateAssetUsages(asset.url, asset.publicId);
    asset.referenceCount = totalCount;
    await asset.save();

    return sendSuccess(res, 200, 'Media asset retrieved.', {
      asset,
      usages: details,
      totalUsages: totalCount,
      isReferenced: totalCount > 0,
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
    const { altText, caption, tags, category } = req.body;

    const updates = {};
    if (altText !== undefined) updates.altText = altText.trim();
    if (caption !== undefined) updates.caption = caption.trim();
    if (category !== undefined) updates.category = category.trim();
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
 * Permanently delete media asset from Cloudinary & DB if NOT referenced by active content.
 * Prevents accidental broken links across the website.
 */
const deleteMediaAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await MediaAsset.findById(id);

    if (!asset) {
      return sendError(res, 404, 'Media asset not found.');
    }

    // Safety check: ensure asset is not referenced across any CMS models
    const { totalCount, details } = await calculateAssetUsages(asset.url, asset.publicId);

    if (totalCount > 0) {
      const summaryList = details.map((d) => `${d.label} (${d.count})`).join(', ');
      return sendError(
        res,
        400,
        `Cannot delete media asset because it is currently referenced by ${totalCount} content item(s): ${summaryList}. Please remove or replace the media in those sections before deleting.`
      );
    }

    // Delete from Cloudinary
    if (asset.publicId && !asset.publicId.startsWith('local_')) {
      try {
        await deleteFromCloudinary(asset.publicId, asset.resourceType);
      } catch (cloudErr) {
        console.warn('Cloudinary delete warning:', cloudErr.message);
      }
    }

    await asset.deleteOne();
    return sendSuccess(res, 200, 'Media asset deleted permanently from storage and database.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/media/audit
 * Audits all media references across CMS collections for broken URLs, missing assets, and orphans.
 */
const auditMediaHealth = async (req, res, next) => {
  try {
    const cloudConfig = getCloudinaryConfig();

    // 1. Gather all registered MediaAssets
    const allAssets = await MediaAsset.find().lean();
    const assetUrlSet = new Set(allAssets.map((a) => a.url));
    const assetPublicIdSet = new Set(allAssets.map((a) => a.publicId));

    // 2. Scan active CMS documents for media URLs
    const cmsReferences = [];

    const addRef = (collection, docId, fieldPath, url, title = '') => {
      if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
        cmsReferences.push({ collection, docId: String(docId), fieldPath, url, title });
      }
    };

    // HomePageContent
    const homeDoc = await HomePageContent.findOne().lean();
    if (homeDoc) {
      if (homeDoc.hero?.videoUrl) addRef('HomePageContent', homeDoc._id, 'hero.videoUrl', homeDoc.hero.videoUrl, 'Hero Video');
      if (homeDoc.hero?.fallbackImage) addRef('HomePageContent', homeDoc._id, 'hero.fallbackImage', homeDoc.hero.fallbackImage, 'Hero Fallback Image');
      if (Array.isArray(homeDoc.garage?.items)) {
        homeDoc.garage.items.forEach((item, idx) => {
          if (item.image) addRef('HomePageContent', homeDoc._id, `garage.items[${idx}].image`, item.image, item.title || 'Garage Item');
        });
      }
      if (Array.isArray(homeDoc.footerSponsors?.sponsorSection?.tiers)) {
        homeDoc.footerSponsors.sponsorSection.tiers.forEach((t, tIdx) => {
          if (Array.isArray(t.sponsors)) {
            t.sponsors.forEach((sp, spIdx) => {
              if (sp.logoUrl) addRef('HomePageContent', homeDoc._id, `sponsorTiers[${tIdx}].sponsors[${spIdx}].logoUrl`, sp.logoUrl, sp.name || 'Sponsor');
            });
          }
        });
      }
    }

    // Team Members
    const teamDocs = await TeamMember.find().lean();
    teamDocs.forEach((m) => {
      if (m.photoUrl) addRef('TeamMember', m._id, 'photoUrl', m.photoUrl, m.fullName || 'Member');
      if (m.imageUrl) addRef('TeamMember', m._id, 'imageUrl', m.imageUrl, m.fullName || 'Member');
    });

    // Gallery Images
    const galleryDocs = await GalleryImage.find().lean();
    galleryDocs.forEach((g) => {
      if (g.imageUrl) addRef('GalleryImage', g._id, 'imageUrl', g.imageUrl, g.title || 'Gallery');
      if (g.videoUrl) addRef('GalleryImage', g._id, 'videoUrl', g.videoUrl, g.title || 'Gallery Video');
      if (g.thumbnailUrl) addRef('GalleryImage', g._id, 'thumbnailUrl', g.thumbnailUrl, g.title || 'Gallery Thumbnail');
    });

    // Nav & Footer
    const navDoc = await NavFooterSettings.findOne().lean();
    if (navDoc) {
      if (navDoc.navbar?.logo) addRef('NavFooterSettings', navDoc._id, 'navbar.logo', navDoc.navbar.logo, 'Navbar Logo');
      if (navDoc.footer?.logo) addRef('NavFooterSettings', navDoc._id, 'footer.logo', navDoc.footer.logo, 'Footer Logo');
      if (navDoc.footer?.brandMarkUrl) addRef('NavFooterSettings', navDoc._id, 'footer.brandMarkUrl', navDoc.footer.brandMarkUrl, 'Brand Mark');
    }

    // 3. Deduplicate and verify reachable status
    const uniqueUrls = [...new Set(cmsReferences.map((r) => r.url))];
    const urlHealth = {};

    await Promise.all(
      uniqueUrls.map(async (u) => {
        try {
          const resp = await fetch(u, { method: 'HEAD' });
          urlHealth[u] = { status: resp.status, ok: resp.ok };
        } catch (err) {
          urlHealth[u] = { status: 0, ok: false, error: err.message };
        }
      })
    );

    const brokenItems = [];
    const healthyItems = [];

    cmsReferences.forEach((ref) => {
      const health = urlHealth[ref.url] || { ok: false, status: 0 };
      const hasDbRecord = assetUrlSet.has(ref.url);
      const itemInfo = {
        ...ref,
        httpStatus: health.status,
        isAccessible: health.ok,
        hasMediaAssetRecord: hasDbRecord,
      };
      if (!health.ok) {
        brokenItems.push(itemInfo);
      } else {
        healthyItems.push(itemInfo);
      }
    });

    // Orphan DB records (MediaAsset exists but is referenced 0 times in active CMS)
    const orphanDbRecords = allAssets.filter((a) => !cmsReferences.some((r) => r.url === a.url));

    return sendSuccess(res, 200, 'Media health audit completed.', {
      storageConfigured: cloudConfig.isConfigured,
      cloudName: cloudConfig.cloudName,
      totalMediaAssets: allAssets.length,
      totalCmsReferences: cmsReferences.length,
      healthyReferencesCount: healthyItems.length,
      brokenReferencesCount: brokenItems.length,
      brokenItems,
      orphanDbRecordsCount: orphanDbRecords.length,
      orphanDbRecords: orphanDbRecords.map((a) => ({
        id: a._id,
        publicId: a.publicId,
        url: a.url,
        resourceType: a.resourceType,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMediaAssets,
  getUploadSignature,
  createMediaAssetFromDirectUpload,
  uploadMediaAsset,
  verifyMediaEndpoint,
  getMediaAssetById,
  updateMediaAsset,
  deleteMediaAsset,
  auditMediaHealth,
};
