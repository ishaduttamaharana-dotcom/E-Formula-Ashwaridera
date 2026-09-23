// ============================================================
//  config/multer.js
//  Multer file upload configuration with 1000MB limit.
// ============================================================

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ─── Extended Limit: 1000 MB for images, videos & documents ─
const MAX_UPLOAD_SIZE = 1000 * 1024 * 1024; // 1000 MB

// ─── Allowed MIME types ──────────────────────────────────────
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
  'video/3gpp',
];

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
  ...ALLOWED_DOC_TYPES,
];

// ─── Disk storage (local uploads folder) ────────────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ─── Memory storage (for Cloudinary streaming) ──────────────
const memoryStorage = multer.memoryStorage();

// ─── File filter factory ─────────────────────────────────────
const createFileFilter = (allowedTypes = ALL_ALLOWED_TYPES) => (req, file, cb) => {
  if (
    allowedTypes.includes(file.mimetype) ||
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.originalname.match(/\.(pdf|doc|docx|jpg|jpeg|png|webp|gif|svg|bmp|tiff|mp4|webm|ogg|mov|avi|mkv)$/i)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: Images, Videos, PDFs, and Documents.`
      ),
      false
    );
  }
};

// ─── Reusable upload middleware (1000MB Limit) ──────────────
const uploadSingleImage = (fieldName = 'image') =>
  multer({
    storage: diskStorage,
    limits: { fileSize: MAX_UPLOAD_SIZE }, // 1000 MB
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
  }).single(fieldName);

const uploadMultipleImages = (fieldName = 'images', maxCount = 20) =>
  multer({
    storage: diskStorage,
    limits: { fileSize: MAX_UPLOAD_SIZE }, // 1000 MB per file
    fileFilter: createFileFilter(ALLOWED_IMAGE_TYPES),
  }).array(fieldName, maxCount);

const uploadToMemory = (fieldName = 'image') =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_UPLOAD_SIZE }, // 1000 MB
    fileFilter: createFileFilter(ALL_ALLOWED_TYPES),
  }).single(fieldName);

const uploadToMemoryFields = (fieldsArray) =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_UPLOAD_SIZE }, // 1000 MB per file
    fileFilter: createFileFilter(ALL_ALLOWED_TYPES),
  }).fields(fieldsArray);

const uploadDocument = (fieldName = 'document') =>
  multer({
    storage: diskStorage,
    limits: { fileSize: MAX_UPLOAD_SIZE }, // 1000 MB
    fileFilter: createFileFilter(ALLOWED_DOC_TYPES),
  }).single(fieldName);

module.exports = {
  MAX_UPLOAD_SIZE,
  uploadSingleImage,
  uploadMultipleImages,
  uploadToMemory,
  uploadToMemoryFields,
  uploadDocument,
};
