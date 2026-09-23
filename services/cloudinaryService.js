// ============================================================
//  services/cloudinaryService.js
//  Cloudinary upload & delete service wrappers using SDK.
// ============================================================

const { cloudinary } = require('../config/cloudinary');
const { Readable }   = require('stream');

/**
 * Uploads an image memory buffer to Cloudinary using a stream.
 *
 * @param {Buffer} fileBuffer - File buffer from Multer (req.file.buffer)
 * @param {string} folder     - Cloudinary folder name (e.g. 'ashwa_cms')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadBufferToCloudinary = (fileBuffer, folder = 'ashwa_cms') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return reject(new Error('Cloudinary credentials missing from environment.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        chunk_size: 20 * 1024 * 1024, // 20 MB chunks
        timeout: 1800000,              // 30 min timeout for large 1000MB files
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
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
 * @param {string} folder     - Cloudinary folder name (e.g. 'ashwa_videos')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadVideoToCloudinary = (fileBuffer, folder = 'ashwa_videos') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return reject(new Error('Cloudinary credentials missing from environment.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        chunk_size: 20 * 1024 * 1024, // 20 MB chunks
        timeout: 1800000,              // 30 min timeout for large 1000MB videos
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Uploads a raw document memory buffer (PDF, DOC, DOCX) to Cloudinary using a stream.
 *
 * @param {Buffer} fileBuffer - File buffer from Multer
 * @param {string} folder     - Cloudinary folder name (e.g. 'ashwa_resumes')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadRawToCloudinary = (fileBuffer, folder = 'ashwa_resumes') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      return reject(new Error('Cloudinary credentials missing from environment.'));
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
          url:      result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
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
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('Cloudinary credentials missing — skipping remote asset deletion.');
    return null;
  }
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  uploadBufferToCloudinary,
  uploadVideoToCloudinary,
  uploadRawToCloudinary,
  deleteFromCloudinary,
};
