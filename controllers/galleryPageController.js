// ============================================================
//  controllers/galleryPageController.js
//  Unified Controller for Gallery Page Control Center.
//  Controls:
//    01. HERO (Label, Heading, Highlight, Description, Background Media, Overlay)
//    02. ALBUMS (Album roster, covers, order, assign/move media)
//    03. GALLERY MEDIA (Images & Videos, metadata, featured, replace, reorder)
//    04. CONFIGURABLE CATEGORIES
//    05. RECRUITMENT CTA & PAGE SETTINGS / SEO
//  Draft / Preview / Publish lifecycle with zero recursive snapshotting.
// ============================================================

const GalleryPageContent = require('../models/GalleryPageContent');
const GalleryAlbum = require('../models/GalleryAlbum');
const GalleryImage = require('../models/GalleryImage');
const NavFooterSettings = require('../models/NavFooterSettings');
const { deleteFromCloudinary } = require('../services/cloudinaryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All', slug: 'all', description: 'All media', order: 1, visible: true, isSystem: true },
  { id: 'image', name: 'Images', slug: 'image', description: 'Photographs and stills', order: 2, visible: true, isSystem: true },
  { id: 'video', name: 'Videos', slug: 'video', description: 'Recap and track video footage', order: 3, visible: true, isSystem: true },
  { id: 'competition', name: 'Competition', slug: 'competition', description: 'Formula Bharat track runs and dynamic events', order: 4, visible: true, isSystem: false },
  { id: 'workshop', name: 'Workshop', slug: 'workshop', description: 'Fabrication, assembly, and CAD engineering', order: 5, visible: true, isSystem: false },
  { id: 'testing', name: 'Testing', slug: 'testing', description: 'Track testing and dyno calibration', order: 6, visible: true, isSystem: false },
  { id: 'events', name: 'Events', slug: 'events', description: 'Team celebrations, unveilings, and exhibitions', order: 7, visible: true, isSystem: false },
  { id: 'formula-bharat', name: 'Formula Bharat', slug: 'formula-bharat', description: 'Official season competitions', order: 8, visible: true, isSystem: false },
];

/**
 * Retrieve or initialize the singleton GalleryPageContent document.
 */
const getOrSeedGalleryDoc = async () => {
  let doc = await GalleryPageContent.findOne();
  if (doc) return doc;

  console.log('⚡ Initializing Gallery Page Control Center document with complete defaults...');

  const initialDoc = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    settings: {
      pageTitle: 'Ashwa Riders — Gallery',
      seoTitle: 'Moments in Motion — Gallery | Ashwa Riders Formula Student',
      seoDescription: 'Explore photos, track videos, car testing, workshop builds, and competition moments of the Ashwa Riders electric racing team.',
      ogImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      canonicalUrl: 'gallery.html',
      visible: true,
    },
    hero: {
      visible: true,
      label: 'GALLERY',
      eyebrow: 'GALLERY',
      headingLine1: 'MOMENTS IN',
      headingHighlight: 'MOTION',
      headingLine2: '',
      description: 'A visual journey through our competitions, events, and the everyday life of the Ashwa Riders team.',
      mediaType: 'image',
      bgImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      desktopImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      videoUrl: '',
      posterUrl: '',
      altText: 'Ashwa Riders Gallery Hero Showcase',
      backgroundPosition: 'center 40%',
      overlay: true,
      overlayStrength: 55,
      textAlignment: 'left',
      entranceAnimation: 'slide-up',
    },
    categories: DEFAULT_CATEGORIES,
    cta: {
      visible: true,
      heading: 'BE PART OF THE',
      highlightedHeading: 'STORY',
      description: 'Join our team and create your own moments of engineering excellence.',
      buttonText: 'JOIN THE TEAM',
      buttonUrl: 'index.html#recruitment',
      buttonIcon: 'fas fa-user-plus',
      openInNewTab: false,
      backgroundColor: '#000000',
      bgImageUrl: '',
    },
  };

  initialDoc.draftVersion = JSON.parse(JSON.stringify(initialDoc));
  initialDoc.publishedVersion = JSON.parse(JSON.stringify(initialDoc));

  doc = await GalleryPageContent.create(initialDoc);
  return doc;
};

/**
 * Format public/preview representation of a Media item.
 */
const formatMediaItem = (itemDoc, isPreview = false) => {
  const m = itemDoc.toObject ? itemDoc.toObject() : itemDoc;
  const source = isPreview ? (m.draftVersion || m) : (m.publishedVersion || m);

  const title = source.title || m.title || source.caption || m.caption || 'Gallery Item';
  const caption = source.caption || m.caption || source.title || m.title || '';
  const description = source.description || m.description || caption;
  const type = source.type || m.type || 'image';
  const category = (source.category || m.category || 'events').toLowerCase().trim();

  const mediaUrl = source.mediaUrl || m.mediaUrl || source.imageUrl || m.imageUrl || source.videoUrl || m.videoUrl || '';
  const imageUrl = source.imageUrl || m.imageUrl || (type === 'image' ? mediaUrl : '');
  const videoUrl = source.videoUrl || m.videoUrl || (type === 'video' ? mediaUrl : '');
  const thumbnailUrl = source.thumbnailUrl || m.thumbnailUrl || imageUrl || '';

  return {
    id: m._id,
    _id: m._id,
    albumId: source.albumId || m.albumId || source.album || m.album || null,
    album: source.album || m.album || source.albumId || m.albumId || null,
    title,
    caption,
    description,
    altText: source.altText || m.altText || title,
    category,
    type,
    mediaType: type,
    mediaUrl,
    imageUrl,
    videoUrl,
    thumbnailUrl,
    publicId: source.publicId || m.publicId || '',
    eventTag: source.eventTag || m.eventTag || '',
    mediaDate: source.mediaDate || m.mediaDate || '',
    isFeatured: Boolean(source.isFeatured !== undefined ? source.isFeatured : m.isFeatured),
    isVisible: source.isVisible !== false && m.isVisible !== false,
    order: source.order !== undefined ? source.order : (source.displayOrder !== undefined ? source.displayOrder : 0),
    status: m.status || 'published',
  };
};

/**
 * Format public/preview representation of an Album.
 */
const formatAlbumItem = (albumDoc, isPreview = false) => {
  const a = albumDoc.toObject ? albumDoc.toObject() : albumDoc;
  const source = isPreview ? (a.draftVersion || a) : (a.publishedVersion || a);
  const coverImage = source.coverImageUrl || a.coverImageUrl || source.coverImage || a.coverImage || '';

  return {
    id: a._id,
    _id: a._id,
    name: source.name || a.name || source.title || a.title || 'Untitled Album',
    title: source.name || a.name || source.title || a.title || 'Untitled Album',
    slug: source.slug || a.slug || '',
    description: source.description || a.description || '',
    coverImageUrl: coverImage,
    coverImage,
    order: source.order !== undefined ? source.order : (source.displayOrder !== undefined ? source.displayOrder : 0),
    status: a.status || 'published',
    isVisible: source.isVisible !== false && a.isVisible !== false,
    mediaCount: a.mediaCount || 0,
  };
};

// ============================================================
//  1. PUBLIC & PREVIEW GALLERY ENDPOINT
// ============================================================

/**
 * GET /api/v1/gallery (and /api/gallery)
 * Unified endpoint returning { settings, hero, categories, albums, media, cta, footer }
 * Supports ?preview=true, ?category=..., ?album=...
 */
const getPublicGalleryContent = async (req, res, next) => {
  try {
    const isPreview = req.query.preview === 'true' || req.query.draft === 'true';
    const doc = await getOrSeedGalleryDoc();

    const source = isPreview
      ? (doc.draftVersion || doc.toObject())
      : (doc.publishedVersion || doc.toObject());

    // Fetch albums
    const albumConditions = [{ isArchived: { $ne: true } }];
    if (!isPreview) {
      albumConditions.push({
        $or: [
          { status: 'published' },
          { publishedVersion: { $ne: null } },
        ],
      });
      albumConditions.push({ isVisible: { $ne: false } });
    }
    const rawAlbums = await GalleryAlbum.find({ $and: albumConditions }).sort({ order: 1, createdAt: 1 });

    // Fetch media items
    const mediaConditions = [{ isArchived: { $ne: true } }];
    if (!isPreview) {
      mediaConditions.push({
        $or: [
          { status: 'published' },
          { publishedVersion: { $ne: null } },
        ],
      });
      mediaConditions.push({ isVisible: { $ne: false } });
    }

    if (req.query.album && req.query.album !== 'all') {
      mediaConditions.push({ albumId: req.query.album });
    }

    if (req.query.category && req.query.category !== 'all') {
      const cat = req.query.category.toLowerCase().trim();
      if (cat === 'image' || cat === 'video') {
        mediaConditions.push({ type: cat });
      } else {
        mediaConditions.push({ category: cat });
      }
    }

    const rawMedia = await GalleryImage.find({ $and: mediaConditions }).sort({ isFeatured: -1, order: 1, createdAt: -1 });

    const formattedAlbums = rawAlbums.map(a => formatAlbumItem(a, isPreview));
    const formattedMedia = rawMedia.map(m => formatMediaItem(m, isPreview));

    // Calculate actual counts per album
    const albumCounts = {};
    formattedMedia.forEach(m => {
      if (m.albumId) {
        albumCounts[String(m.albumId)] = (albumCounts[String(m.albumId)] || 0) + 1;
      }
    });
    formattedAlbums.forEach(a => {
      a.mediaCount = albumCounts[String(a.id)] || 0;
    });

    // Categories with calculated counts
    const rawCats = (source.categories && source.categories.length > 0) ? source.categories : DEFAULT_CATEGORIES;
    const categories = rawCats.map(cat => {
      const c = (cat && typeof cat.toObject === 'function') ? cat.toObject() : { ...cat };
      const id = (c.id || c.slug || c.name || '').toLowerCase().trim();
      const label = c.label || c.name || c.id || '';
      let count = 0;
      if (id === 'all') {
        count = formattedMedia.length;
      } else if (id === 'image' || id === 'images') {
        count = formattedMedia.filter(m => m.type === 'image' || m.mediaType === 'image').length;
      } else if (id === 'video' || id === 'videos') {
        count = formattedMedia.filter(m => m.type === 'video' || m.mediaType === 'video').length;
      } else {
        count = formattedMedia.filter(m => (m.category || '').toLowerCase() === id).length;
      }
      return {
        ...c,
        id,
        slug: id,
        name: label,
        label,
        count,
      };
    });

    // Shared global footer
    let footerData = null;
    try {
      const footerDoc = await NavFooterSettings.findOne();
      if (footerDoc) {
        footerData = isPreview
          ? (footerDoc.draftVersion?.footer || footerDoc.footer)
          : (footerDoc.publishedVersion?.footer || footerDoc.footer);
      }
    } catch (e) {}

    return sendSuccess(res, 200, 'Gallery content retrieved successfully.', {
      settings: source.settings || {},
      hero: source.hero || {},
      categories,
      albums: formattedAlbums,
      media: formattedMedia,
      cta: source.cta || {},
      footer: footerData,
      status: doc.status,
      lastPublishedAt: doc.lastPublishedAt,
      version: doc.version,
      isPreview,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  2. ADMIN CONTROL CENTER ENDPOINTS
// ============================================================

/**
 * GET /api/v1/admin/gallery/page
 * Returns full Gallery control center document (draft & published), all albums, and all media.
 */
const getAdminGalleryContent = async (req, res, next) => {
  try {
    const doc = await getOrSeedGalleryDoc();
    const [albums, media] = await Promise.all([
      GalleryAlbum.find().sort({ order: 1, createdAt: 1 }),
      GalleryImage.find().sort({ order: 1, createdAt: -1 }),
    ]);

    return sendSuccess(res, 200, 'Admin gallery control center data retrieved.', {
      page: doc,
      albums: albums.map(a => formatAlbumItem(a, true)),
      media: media.map(m => formatMediaItem(m, true)),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/gallery/page
 * Updates draft state of Gallery page content (hero, categories, cta, settings).
 */
const updateGalleryDraft = async (req, res, next) => {
  try {
    const doc = await getOrSeedGalleryDoc();
    const data = req.body || {};

    const draft = doc.draftVersion || doc.toObject();

    if (data.settings) draft.settings = Object.assign({}, draft.settings, data.settings);
    if (data.hero) draft.hero = Object.assign({}, draft.hero, data.hero);
    if (Array.isArray(data.categories)) draft.categories = data.categories;
    if (data.cta) draft.cta = Object.assign({}, draft.cta, data.cta);

    doc.draftVersion = draft;
    doc.status = 'draft';
    doc.lastEditedAt = new Date();

    doc.markModified('draftVersion');
    await doc.save();

    return sendSuccess(res, 200, 'Gallery draft saved successfully.', {
      draftVersion: doc.draftVersion,
      status: doc.status,
      lastEditedAt: doc.lastEditedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/gallery/page/publish
 * Publishes draft content live and publishes any pending draft albums & media.
 * Strips recursive version snapshots!
 */
const publishGallery = async (req, res, next) => {
  try {
    const doc = await getOrSeedGalleryDoc();

    // Snapshot draft to published (clean without nested snapshots)
    const rawDraft = doc.draftVersion ? JSON.parse(JSON.stringify(doc.draftVersion)) : doc.toObject();
    delete rawDraft.publishedVersion;
    delete rawDraft.draftVersion;
    const snapshot = rawDraft;

    doc.publishedVersion = snapshot;
    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    doc.markModified('publishedVersion');
    await doc.save();

    // Publish all active draft albums
    const draftAlbums = await GalleryAlbum.find({ status: 'draft' });
    for (const a of draftAlbums) {
      const albSnapshot = a.draftVersion ? JSON.parse(JSON.stringify(a.draftVersion)) : a.toObject();
      delete albSnapshot.publishedVersion;
      delete albSnapshot.draftVersion;
      a.publishedVersion = albSnapshot;
      a.status = 'published';
      a.markModified('publishedVersion');
      await a.save();
    }

    // Publish all active draft media
    const draftMedia = await GalleryImage.find({ status: 'draft' });
    for (const m of draftMedia) {
      const medSnapshot = m.draftVersion ? JSON.parse(JSON.stringify(m.draftVersion)) : m.toObject();
      delete medSnapshot.publishedVersion;
      delete medSnapshot.draftVersion;
      m.publishedVersion = medSnapshot;
      m.status = 'published';
      m.markModified('publishedVersion');
      await m.save();
    }

    if (req.user) {
      await logActivity(req.user._id, 'publish', 'GalleryPageContent', doc._id, {
        version: doc.version,
        timestamp: doc.lastPublishedAt,
      });
    }

    return sendSuccess(res, 200, 'Gallery page published live successfully!', {
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      status: 'published',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  3. MEDIA ITEMS CRUD & ACTIONS
// ============================================================

/**
 * GET /api/v1/admin/gallery/media
 */
const listGalleryMediaAdmin = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.album && req.query.album !== 'all') filter.albumId = req.query.album;
    if (req.query.category && req.query.category !== 'all') filter.category = req.query.category.toLowerCase();
    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    const items = await GalleryImage.find(filter).sort({ order: 1, createdAt: -1 });
    return sendSuccess(res, 200, 'Gallery media items retrieved.', items.map(m => formatMediaItem(m, true)));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/gallery/media
 */
const createGalleryMediaAdmin = async (req, res, next) => {
  try {
    const data = req.body || {};
    const mediaUrl = (data.mediaUrl || data.imageUrl || data.videoUrl || '').trim();
    const type = (data.mediaType || data.type) === 'video' ? 'video' : 'image';
    const imageUrl = (data.imageUrl || data.thumbnailUrl || (type === 'image' ? mediaUrl : (data.posterUrl || mediaUrl))).trim();
    const videoUrl = (data.videoUrl || (type === 'video' ? mediaUrl : '')).trim();

    if (!mediaUrl && !imageUrl && !videoUrl) {
      return sendError(res, 400, 'Image URL or Video URL is required.');
    }

    const isPublished = data.publishNow || data.status === 'published';

    const mediaObj = {
      title: data.title ? data.title.trim() : (data.caption ? data.caption.trim() : 'Gallery Item'),
      caption: data.caption ? data.caption.trim() : (data.title ? data.title.trim() : ''),
      description: data.description ? data.description.trim() : (data.caption ? data.caption.trim() : ''),
      altText: data.altText ? data.altText.trim() : (data.title || 'Ashwa Riders Gallery Media'),
      category: data.category ? data.category.toLowerCase().trim() : 'events',
      type,
      imageUrl: imageUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png',
      videoUrl,
      thumbnailUrl: (data.thumbnailUrl || imageUrl).trim(),
      albumId: data.albumId || data.album || null,
      publicId: data.publicId || '',
      mediaDate: data.mediaDate || '',
      isFeatured: Boolean(data.isFeatured),
      isVisible: data.isVisible !== false,
      order: data.order !== undefined ? Number(data.order) : 0,
      status: isPublished ? 'published' : (data.status || 'draft'),
      createdBy: req.user ? req.user._id : null,
    };

    if (isPublished) {
      mediaObj.publishedVersion = JSON.parse(JSON.stringify(mediaObj));
    }
    mediaObj.draftVersion = JSON.parse(JSON.stringify(mediaObj));

    const item = await GalleryImage.create(mediaObj);
    return sendSuccess(res, 201, 'Media item created successfully.', formatMediaItem(item, true));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/gallery/media/:id
 */
const updateGalleryMediaAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const item = await GalleryImage.findById(id);
    if (!item) return sendError(res, 404, 'Media item not found.');

    const raw = item.toObject();
    const updated = {
      title: data.title !== undefined ? data.title.trim() : raw.title,
      caption: data.caption !== undefined ? data.caption.trim() : raw.caption,
      description: data.description !== undefined ? data.description.trim() : raw.description,
      altText: data.altText !== undefined ? data.altText.trim() : raw.altText,
      category: data.category !== undefined ? data.category.toLowerCase().trim() : raw.category,
      type: data.type !== undefined ? (data.type === 'video' ? 'video' : 'image') : raw.type,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl.trim() : raw.imageUrl,
      videoUrl: data.videoUrl !== undefined ? data.videoUrl.trim() : raw.videoUrl,
      albumId: data.albumId !== undefined ? (data.albumId || null) : raw.albumId,
      publicId: data.publicId !== undefined ? data.publicId.trim() : raw.publicId,
      mediaDate: data.mediaDate !== undefined ? data.mediaDate.trim() : raw.mediaDate,
      isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : raw.isFeatured,
      isVisible: data.isVisible !== undefined ? Boolean(data.isVisible) : raw.isVisible,
      order: data.order !== undefined ? Number(data.order) : raw.order,
      status: data.publishNow ? 'published' : (data.status || raw.status || 'draft'),
      updatedBy: req.user ? req.user._id : null,
    };

    // Apply to item
    Object.assign(item, updated);
    item.draftVersion = JSON.parse(JSON.stringify(updated));

    if (data.publishNow || data.status === 'published') {
      item.status = 'published';
      item.publishedVersion = JSON.parse(JSON.stringify(updated));
      item.markModified('publishedVersion');
    }

    item.markModified('draftVersion');
    await item.save();

    return sendSuccess(res, 200, 'Media item updated successfully.', formatMediaItem(item, true));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/gallery/media/:id
 */
const deleteGalleryMediaAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await GalleryImage.findById(id);
    if (!item) return sendError(res, 404, 'Media item not found.');

    if (item.publicId) {
      try {
        await deleteFromCloudinary(item.publicId);
      } catch (e) {}
    }

    await GalleryImage.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Media item deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/gallery/media/reorder
 */
const reorderGalleryMediaAdmin = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return sendError(res, 400, 'orderedIds array is required.');

    const updates = orderedIds.map((id, index) =>
      GalleryImage.findByIdAndUpdate(id, { $set: { order: index } })
    );
    await Promise.all(updates);

    return sendSuccess(res, 200, 'Media reordered successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  4. ALBUMS CRUD & ACTIONS
// ============================================================

/**
 * GET /api/v1/admin/gallery/albums
 */
const listGalleryAlbumsAdmin = async (req, res, next) => {
  try {
    const albums = await GalleryAlbum.find().sort({ order: 1, createdAt: 1 });
    const formatted = albums.map(a => formatAlbumItem(a, true));

    // Calculate item counts
    const counts = await GalleryImage.aggregate([
      { $match: { albumId: { $ne: null } } },
      { $group: { _id: '$albumId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[String(c._id)] = c.count; });
    formatted.forEach(a => { a.mediaCount = countMap[String(a.id)] || 0; });

    return sendSuccess(res, 200, 'Albums retrieved successfully.', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/gallery/albums
 */
const createGalleryAlbumAdmin = async (req, res, next) => {
  try {
    const data = req.body || {};
    const name = (data.name || data.title || '').trim();
    if (!name) return sendError(res, 400, 'Album name is required.');

    const slug = (data.slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const isPublished = data.publishNow || data.status === 'published';

    const albumObj = {
      name,
      slug,
      description: data.description ? data.description.trim() : '',
      coverImageUrl: (data.coverImageUrl || data.coverImage || '').trim(),
      coverPublicId: data.coverPublicId ? data.coverPublicId.trim() : '',
      isVisible: data.isVisible !== false,
      order: data.order !== undefined ? Number(data.order) : 0,
      status: isPublished ? 'published' : (data.status || 'draft'),
      createdBy: req.user ? req.user._id : null,
    };

    if (isPublished) {
      albumObj.publishedVersion = JSON.parse(JSON.stringify(albumObj));
    }
    albumObj.draftVersion = JSON.parse(JSON.stringify(albumObj));

    const album = await GalleryAlbum.create(albumObj);
    return sendSuccess(res, 201, 'Album created successfully.', formatAlbumItem(album, true));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/gallery/albums/:id
 */
const updateGalleryAlbumAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body || {};

    const album = await GalleryAlbum.findById(id);
    if (!album) return sendError(res, 404, 'Album not found.');

    const raw = album.toObject();
    const updated = {
      name: data.name !== undefined ? data.name.trim() : raw.name,
      slug: data.slug !== undefined ? data.slug.trim() : raw.slug,
      description: data.description !== undefined ? data.description.trim() : raw.description,
      coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl.trim() : raw.coverImageUrl,
      coverPublicId: data.coverPublicId !== undefined ? data.coverPublicId.trim() : raw.coverPublicId,
      isVisible: data.isVisible !== undefined ? Boolean(data.isVisible) : raw.isVisible,
      order: data.order !== undefined ? Number(data.order) : raw.order,
      status: data.publishNow ? 'published' : (data.status || raw.status || 'draft'),
      updatedBy: req.user ? req.user._id : null,
    };

    Object.assign(album, updated);
    album.draftVersion = JSON.parse(JSON.stringify(updated));

    if (data.publishNow || data.status === 'published') {
      album.status = 'published';
      album.publishedVersion = JSON.parse(JSON.stringify(updated));
      album.markModified('publishedVersion');
    }

    album.markModified('draftVersion');
    await album.save();

    return sendSuccess(res, 200, 'Album updated successfully.', formatAlbumItem(album, true));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/gallery/albums/:id
 */
const deleteGalleryAlbumAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const album = await GalleryAlbum.findById(id);
    if (!album) return sendError(res, 404, 'Album not found.');

    // Unassign media items from this album instead of deleting them outright
    await GalleryImage.updateMany({ albumId: id }, { $set: { albumId: null } });

    await GalleryAlbum.findByIdAndDelete(id);
    return sendSuccess(res, 200, 'Album deleted and media unassigned successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/gallery/albums/reorder
 */
const reorderGalleryAlbumsAdmin = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return sendError(res, 400, 'orderedIds array is required.');

    const updates = orderedIds.map((id, index) =>
      GalleryAlbum.findByIdAndUpdate(id, { $set: { order: index } })
    );
    await Promise.all(updates);

    return sendSuccess(res, 200, 'Albums reordered successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrSeedGalleryDoc,
  formatMediaItem,
  formatAlbumItem,
  getPublicGalleryContent,
  getAdminGalleryContent,
  updateGalleryDraft,
  publishGallery,
  listGalleryMediaAdmin,
  createGalleryMediaAdmin,
  updateGalleryMediaAdmin,
  deleteGalleryMediaAdmin,
  reorderGalleryMediaAdmin,
  listGalleryAlbumsAdmin,
  createGalleryAlbumAdmin,
  updateGalleryAlbumAdmin,
  deleteGalleryAlbumAdmin,
  reorderGalleryAlbumsAdmin,
};
