// ============================================================
//  config/cloudinary.js
//  Cloudinary SDK configuration — upload functionality will be
//  added in a later phase. This file only configures the SDK.
// ============================================================

const cloudinary = require('cloudinary').v2;

/**
 * Configures the Cloudinary SDK with credentials from environment
 * variables. Call this once at application startup.
 */
const configureCloudinary = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.warn(
      '⚠️   Cloudinary credentials are missing. File upload features will not work.'
    );
    return;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS
  });

  console.log('☁️   Cloudinary configured successfully.');
};

/**
 * Generates signature and parameters for direct client-to-Cloudinary uploads.
 * Bypasses serverless payload size limitations (e.g. Vercel 4.5MB).
 */
const generateUploadSignature = (folder = 'ashwa_cms') => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    folder,
  };
};

module.exports = { cloudinary, configureCloudinary, generateUploadSignature };

