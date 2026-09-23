// ============================================================
//  controllers/galleryController.js
//  Handlers for Gallery CMS (gallery_albums & gallery_images).
// ============================================================

const GalleryAlbum                        = require('../models/GalleryAlbum');
const GalleryImage                        = require('../models/GalleryImage');
const { deleteFromCloudinary }            = require('../services/cloudinaryService');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

// ============================================================
//  1. ALBUMS ENDPOINTS
// ============================================================

/**
 * GET /api/v1/gallery/albums
 * Get all albums sorted by displayOrder.
 */
const getAlbums = async (req, res, next) => {
  try {
    const albums = await GalleryAlbum.find().sort({ displayOrder: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Gallery albums retrieved successfully.', albums);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/gallery/albums
 * Create a new album (Admin Only).
 */
const createAlbum = async (req, res, next) => {
  try {
    const { name, description, coverImageUrl, coverPublicId, displayOrder } = req.body;

    if (!name) {
      return sendError(res, 400, 'Album name is required.');
    }

    const album = await GalleryAlbum.create({
      name:           name.trim(),
      description:    description ? description.trim() : '',
      coverImageUrl:  coverImageUrl ? coverImageUrl.trim() : '',
      coverPublicId:  coverPublicId ? coverPublicId.trim() : '',
      displayOrder:   displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    return sendSuccess(res, 201, 'Gallery album created successfully.', album);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/gallery/albums/:id
 * Update album details (Admin Only).
 */
const updateAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, coverImageUrl, coverPublicId, displayOrder } = req.body;

    const updates = {};
    if (name !== undefined)          updates.name          = name.trim();
    if (description !== undefined)   updates.description   = description.trim();
    if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl.trim();
    if (coverPublicId !== undefined) updates.coverPublicId = coverPublicId.trim();
    if (displayOrder !== undefined)  updates.displayOrder  = Number(displayOrder);

    const album = await GalleryAlbum.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!album) return sendError(res, 404, 'Gallery album not found.');

    return sendSuccess(res, 200, 'Gallery album updated successfully.', album);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/gallery/albums/:id
 * Delete album AND delete all contained images + Cloudinary assets (Admin Only).
 */
const deleteAlbum = async (req, res, next) => {
  try {
    const { id } = req.params;

    const album = await GalleryAlbum.findById(id);
    if (!album) return sendError(res, 404, 'Gallery album not found.');

    // Fetch all images under this album
    const images = await GalleryImage.find({ albumId: id });

    // Clean up Cloudinary assets for all images
    for (const img of images) {
      if (img.publicId) {
        try {
          await deleteFromCloudinary(img.publicId, img.type === 'video' ? 'video' : 'image');
        } catch (cErr) {
          console.warn(`Failed to delete Cloudinary asset ${img.publicId}:`, cErr.message);
        }
      }
    }

    // Clean up cover image if present
    if (album.coverPublicId) {
      try {
        await deleteFromCloudinary(album.coverPublicId);
      } catch (cErr) {
        console.warn(`Failed to delete album cover ${album.coverPublicId}:`, cErr.message);
      }
    }

    // Delete image documents and album document
    await GalleryImage.deleteMany({ albumId: id });
    await album.deleteOne();

    return sendSuccess(res, 200, 'Gallery album and all contained images deleted successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  2. IMAGES ENDPOINTS
// ============================================================

/**
 * GET /api/v1/gallery/images
 * GET /api/v1/gallery/images/:albumId
 * Get gallery images (Public).
 */
const getImages = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const filter = albumId ? { albumId } : {};

    const images = await GalleryImage.find(filter).sort({ displayOrder: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Gallery images retrieved successfully.', images);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/gallery/images
 * Create a new gallery image (Admin Only).
 */
const createImage = async (req, res, next) => {
  try {
    const { albumId, caption, category, type, imageUrl, publicId, displayOrder } = req.body;

    if (!albumId || !imageUrl || !publicId) {
      return sendError(res, 400, 'Album ID, image URL, and public ID are required.');
    }

    const albumExists = await GalleryAlbum.findById(albumId);
    if (!albumExists) return sendError(res, 404, 'Specified album does not exist.');

    const image = await GalleryImage.create({
      albumId,
      caption:      caption ? caption.trim() : '',
      category:     category ? category.trim() : 'event',
      type:         type || 'image',
      imageUrl:     imageUrl.trim(),
      publicId:     publicId.trim(),
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    return sendSuccess(res, 201, 'Gallery image created successfully.', image);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/gallery/images/:id
 * Update image metadata or caption (Admin Only).
 */
const updateImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption, category, albumId, displayOrder } = req.body;

    const updates = {};
    if (caption !== undefined)      updates.caption      = caption.trim();
    if (category !== undefined)     updates.category     = category.trim();
    if (albumId !== undefined)      updates.albumId      = albumId;
    if (displayOrder !== undefined) updates.displayOrder = Number(displayOrder);

    const image = await GalleryImage.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!image) return sendError(res, 404, 'Gallery image not found.');

    return sendSuccess(res, 200, 'Gallery image updated successfully.', image);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/gallery/images/:id/replace
 * Replace gallery image file (Admin Only).
 */
const replaceImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageUrl, publicId, caption } = req.body;

    if (!imageUrl || !publicId) {
      return sendError(res, 400, 'New image URL and public ID are required.');
    }

    const image = await GalleryImage.findById(id);
    if (!image) return sendError(res, 404, 'Gallery image not found.');

    // Delete old Cloudinary asset
    if (image.publicId) {
      try {
        await deleteFromCloudinary(image.publicId, image.type === 'video' ? 'video' : 'image');
      } catch (cErr) {
        console.warn(`Failed to delete replaced Cloudinary asset ${image.publicId}:`, cErr.message);
      }
    }

    image.imageUrl = imageUrl.trim();
    image.publicId = publicId.trim();
    if (caption !== undefined) image.caption = caption.trim();

    await image.save();

    return sendSuccess(res, 200, 'Gallery image replaced successfully.', image);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/gallery/images/:id
 * Delete single image & remove Cloudinary asset (Admin Only).
 */
const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await GalleryImage.findById(id);
    if (!image) return sendError(res, 404, 'Gallery image not found.');

    if (image.publicId) {
      try {
        await deleteFromCloudinary(image.publicId, image.type === 'video' ? 'video' : 'image');
      } catch (cErr) {
        console.warn(`Failed to delete Cloudinary asset ${image.publicId}:`, cErr.message);
      }
    }

    await image.deleteOne();

    return sendSuccess(res, 200, 'Gallery image deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Albums
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  // Images
  getImages,
  createImage,
  updateImage,
  replaceImage,
  deleteImage,
};
