// ============================================================
//  app.js
//  Express application factory.
//  Production ready with safe database connection handling.
//  Updated: 2026-09-24
// ============================================================

const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const morgan        = require('morgan');
const compression   = require('compression');
const cookieParser  = require('cookie-parser');
const rateLimit     = require('express-rate-limit');
const path          = require('path');

// ─── Internal modules ────────────────────────────────────────
const apiRouter         = require('./routes/index');
const errorHandler      = require('./middleware/errorMiddleware');
const notFound          = require('./middleware/notFoundMiddleware');
const { morganStream }  = require('./utils/logger');

// ─── Cloudinary startup configuration ───────────────────────
const { configureCloudinary } = require('./config/cloudinary');
configureCloudinary();

// ─── Create Express app ──────────────────────────────────────
const app = express();

// Trust proxy headers from Vercel / reverse proxies
app.set('trust proxy', 1);

// ============================================================
//  SECURITY MIDDLEWARE
// ============================================================

// Helmet — sets secure HTTP response headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: process.env.NODE_ENV === 'production' && !process.env.VERCEL ? undefined : false,
  })
);

// ============================================================
//  CORS
// ============================================================

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} is not allowed.`));
    }
  },
  credentials: true,              // Allow cookies / Authorization headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,      // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight for all routes

// ============================================================
//  GLOBAL RATE LIMITING
// ============================================================

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15-minute window
  max: 100,                     // Max requests per window per IP
  standardHeaders: true,        // Return rate-limit info in RateLimit-* headers
  legacyHeaders: false,         // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'development' || process.env.VERCEL, // Disable in dev/serverless
});

app.use('/api', globalLimiter);

// ============================================================
//  REQUEST PARSING
// ============================================================

// JSON body parser — moderate limit permits clean rich-text CMS payloads while blocking large media uploads
app.use(express.json({ limit: '1mb' }));

// URL-encoded body parser (for form submissions)
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parser — reads cookies from request headers
app.use(cookieParser());

// ============================================================
//  COMPRESSION
// ============================================================

app.use(
  compression({
    level: 6,                  // Compression level (0-9)
    threshold: 1024,           // Only compress responses > 1 KB
    filter: (req, res) => {
      // Don't compress responses with 'no-transform' header
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  })
);

// ============================================================
//  HTTP REQUEST LOGGING (Morgan)
// ============================================================

if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
  // Colorized, concise output to console for development & Vercel serverless
  app.use(morgan('dev'));
} else {
  // Combined format written to log file in persistent production server
  app.use(morgan('combined', { stream: morganStream }));
}

// ============================================================
//  DATABASE CONNECTION MIDDLEWARE (Serverless-Safe)
// ============================================================

const connectDB = require('./config/db');
const { getDatabaseDiagnostic, categorizeMongoError } = require('./config/db');

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
    try {
      await connectDB();
    } catch (dbErr) {
      const diag = getDatabaseDiagnostic();
      const category = categorizeMongoError(dbErr);
      console.error(`[DB_ERROR] Category: ${category}, Error: ${dbErr.message}`);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please ensure MONGODB_URI is set in Vercel environment variables and 0.0.0.0/0 is whitelisted in MongoDB Atlas.',
        diagnostic: {
          MONGODB_URI_PRESENT: diag.MONGODB_URI_PRESENT,
          DATABASE_NAME_PRESENT: diag.DATABASE_NAME_PRESENT,
          CONNECTION_STATE: diag.CONNECTION_STATE,
          CONNECTION_ERROR_CATEGORY: category,
          matchingEnvKeys: diag.matchingEnvKeys,
        },
      });
    }
  }
  next();
});

// ============================================================
//  STATIC FILES
// ============================================================

const seoMiddleware    = require('./middleware/seoMiddleware');

// Serve uploaded files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// SSR SEO Meta Injector Middleware for public HTML requests
app.use(seoMiddleware);

// Serve public assets
app.use(express.static(path.join(__dirname, 'public')));

// Dynamic API No-Cache Middleware (ensures fresh load receives published content)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Protect sensitive paths from static serving
app.use((req, res, next) => {
  const forbiddenPatterns = [/\.env/i, /\.git/i, /node_modules/i, /package(-lock)?\.json/i, /\.md$/i];
  if (forbiddenPatterns.some((pattern) => pattern.test(req.path))) {
    return res.status(403).json({ success: false, message: 'Access forbidden.' });
  }
  next();
});

app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);
app.use('/v1', apiRouter);

// Serve Admin Panel SPA for /admin and /admin/* routes
app.get(['/admin', '/admin/*'], (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// ============================================================
//  ERROR HANDLING  —  must be LAST
// ============================================================

// 404 — catch unmatched routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
