// ============================================================
//  config/cloudinary.js
//  Cloudinary SDK configuration with multi-source credential resolution.
//  Supports explicit ENV vars, CLOUDINARY_URL parsing, and project defaults.
// ============================================================

const cloudinary = require('cloudinary').v2;

/**
 * Resolves Cloudinary configuration from multiple environment sources
 * or authentic project credentials.
 */
const getCloudinaryConfig = () => {
  // 1. Direct environment variables
  let cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_NAME ||
    process.env.CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    '';
  let apiKey =
    process.env.CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    '';
  let apiSecret =
    process.env.CLOUDINARY_API_SECRET ||
    '';

  // 2. Parse CLOUDINARY_URL (e.g. cloudinary://api_key:api_secret@cloud_name)
  const cloudUrl = process.env.CLOUDINARY_URL || '';
  if (cloudUrl && (!cloudName || !apiKey || !apiSecret)) {
    try {
      const match = cloudUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    } catch (e) {
      // Ignore URL parse error
    }
  }

  // 3. Fallback to authentic Ashwa Riders project credentials
  if (!cloudName || !apiKey || !apiSecret) {
    cloudName = cloudName || 'i2wo14vs';
    apiKey = apiKey || '193955141178618';
    apiSecret = apiSecret || 'MF5GcXDPL4Jmd8jGHNmKybUpSsc';
  }

  return {
    cloudName: cloudName.trim(),
    apiKey: apiKey.trim(),
    apiSecret: apiSecret.trim(),
    isConfigured: Boolean(cloudName && apiKey && apiSecret),
  };
};

/**
 * Configures the Cloudinary SDK with resolved credentials.
 * Call this once at application startup or when verifying credentials.
 */
const configureCloudinary = () => {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    console.warn('⚠️   Cloudinary credentials missing. File upload features will not work.');
    return;
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true, // Always use HTTPS
  });

  console.log(`☁️   Cloudinary configured successfully for cloud: ${config.cloudName}`);
};

/**
 * Generates signature and parameters for direct client-to-Cloudinary uploads.
 * Bypasses serverless payload size limitations (e.g. Vercel 4.5MB).
 */
const generateUploadSignature = (folder = 'ashwa_cms') => {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    return null;
  }

  // Ensure Cloudinary SDK is initialized with resolved config
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.apiSecret);

  return {
    signature,
    timestamp,
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder,
  };
};

module.exports = {
  cloudinary,
  configureCloudinary,
  getCloudinaryConfig,
  generateUploadSignature,
};
