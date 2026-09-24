// ============================================================
//  services/cloudinaryService.js
//  Cloudinary upload, verification & delete service wrappers.
// ============================================================

const { cloudinary, getCloudinaryConfig } = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Ensures Cloudinary SDK has active configuration before performing operations.
 */
const ensureConfig = () => {
  const config = getCloudinaryConfig();
  if (!config.isConfigured) {
    throw new Error('Cloudinary credentials missing or unconfigured.');
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
  return config;
};

/**
 * Uploads an image memory buffer to Cloudinary using a stream.
 *
 * @param {Buffer} fileBuffer - File buffer from Multer (req.file.buffer)
 * @param {string} folder     - Cloudinary folder name (e.g. 'ashwa_cms/images')
 * @returns {Promise<{ url: string, secureUrl: string, publicId: string, width: number, height: number, bytes: number, format: string, resourceType: string }>}
 */
const uploadBufferToCloudinary = (fileBuffer, folder = 'ashwa_cms/images') => {
  return new Promise((resolve, reject) => {
    try {
      ensureConfig();
    } catch (err) {
      return reject(err);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        chunk_size: 20 * 1024 * 1024, // 20 MB chunks
        timeout: 1800000,              // 30 min timeout
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url || result.url,
          publicId: result.public_id,
          width: result.width || 0,
          height: result.height || 0,
          bytes: result.bytes || 0,
          format: result.format || '',
          resourceType: result.resource_type || 'image',
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Uploads a video memory buffer to Cloudinary using a stream.
 *
 * @param {Buffer} fileBuffer - File buffer from Multer (req.file.buffer)
 * @param {string} folder     - Cloudinary folder name (e.g. 'ashwa_cms/videos')
 * @returns {Promise<{ url: string, secureUrl: string, publicId: string, width: number, height: number, bytes: number, format: string, duration: number, resourceType: string }>}
 */
const uploadVideoToCloudinary = (fileBuffer, folder = 'ashwa_cms/videos') => {
  return new Promise((resolve, reject) => {
    try {
      ensureConfig();
    } catch (err) {
      return reject(err);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        chunk_size: 20 * 1024 * 1024, // 20 MB chunks
        timeout: 1800000,              // 30 min timeout
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url || result.url,
          publicId: result.public_id,
          width: result.width || 0,
          height: result.height || 0,
          bytes: result.bytes || 0,
          format: result.format || '',
          duration: result.duration || 0,
          resourceType: 'video',
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Uploads a raw document memory buffer (PDF, DOC, DOCX) to Cloudinary.
 *
 * @param {Buffer} fileBuffer - File buffer from Multer
 * @param {string} folder     - Cloudinary folder name (e.g. 'ashwa_cms/documents')
 * @returns {Promise<{ url: string, secureUrl: string, publicId: string, bytes: number, format: string, resourceType: string }>}
 */
const uploadRawToCloudinary = (fileBuffer, folder = 'ashwa_cms/documents') => {
  return new Promise((resolve, reject) => {
    try {
      ensureConfig();
    } catch (err) {
      return reject(err);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        chunk_size: 20 * 1024 * 1024,
        timeout: 1800000,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url || result.url,
          secureUrl: result.secure_url || result.url,
          publicId: result.public_id,
          bytes: result.bytes || 0,
          format: result.format || '',
          resourceType: 'raw',
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Verifies that a Cloudinary asset exists and is accessible.
 *
 * @param {string} publicId
 * @param {string} resourceType - 'image', 'video', or 'raw'
 * @param {string} [checkUrl]   - Optional URL to verify via HEAD request
 * @returns {Promise<{ exists: boolean, details?: object, error?: string }>}
 */
const verifyCloudinaryAsset = async (publicId, resourceType = 'image', checkUrl = '') => {
  if (!publicId) return { exists: false, error: 'No publicId provided' };

  try {
    ensureConfig();
    const res = await cloudinary.api.resource(publicId, { resource_type: resourceType });
    return { exists: true, details: res };
  } catch (err) {
    // If Admin API resource call failed, try HEAD request on checkUrl as fallback
    if (checkUrl) {
      try {
        const headRes = await fetch(checkUrl, { method: 'HEAD' });
        if (headRes.ok) {
          return { exists: true, details: { url: checkUrl, status: headRes.status } };
        }
      } catch (headErr) {
        // ignore
      }
    }
    return { exists: false, error: err.message };
  }
};

/**
 * Deletes an asset from Cloudinary using its public ID.
 *
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image', 'video', or 'raw'
 * @returns {Promise<object>} Result from Cloudinary API
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  try {
    ensureConfig();
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn(`Cloudinary delete warning for ${publicId}:`, err.message);
    return null;
  }
};

module.exports = {
  uploadBufferToCloudinary,
  uploadVideoToCloudinary,
  uploadRawToCloudinary,
  verifyCloudinaryAsset,
  deleteFromCloudinary,
};
