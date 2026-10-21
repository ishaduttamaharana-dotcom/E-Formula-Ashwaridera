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
const fs            = require('fs');

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

const defaultAllowedOrigins = [
  'https://www.e-formulaashwariders.in',
  'https://e-formulaashwariders.in',
  'http://www.e-formulaashwariders.in',
  'http://e-formulaashwariders.in',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:3000',
];

const envAllowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGINS,
]
  .filter(Boolean)
  .flatMap((val) => val.split(',').map((o) => o.trim()).filter(Boolean));

const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow requests with no origin (e.g. mobile apps, curl, Postman, same-origin)

  if (allowedOriginsSet.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();

    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'e-formulaashwariders.in' ||
      host.endsWith('.e-formulaashwariders.in') ||
      host === 'ashwariders.in' ||
      host.endsWith('.ashwariders.in') ||
      host === 'ashwariders.com' ||
      host.endsWith('.ashwariders.com') ||
      host.endsWith('.vercel.app')
    ) {
      return true;
    }
  } catch (e) {
    // URL parse failed, reject unknown origin format
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      const corsErr = new Error(`CORS policy: origin ${origin} is not allowed.`);
      corsErr.statusCode = 403;
      callback(corsErr);
    }
  },
  credentials: true,              // Allow cookies / Authorization headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
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

// Serve public assets with no-cache headers to guarantee browsers execute latest scripts
const staticOptions = {
  maxAge: 0,
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.css')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  },
};
app.use(express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/public', express.static(path.join(__dirname, 'public'), staticOptions));

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
app.get(['/admin', '/admin/*', '/public/admin', '/public/admin/*'], (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Public HTML page routes (guarantees clean URLs, lowercase, uppercase, and /public/ aliases resolve cleanly)
const servePublicHtml = (fileName) => (req, res) => {
  res.sendFile(path.join(__dirname, 'public', fileName));
};

// Robots.txt & XML Sitemap resilient content getters
const getSitemapXml = () => {
  const filePath = path.join(__dirname, 'public', 'sitemap.xml');
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    // Fall back to in-memory sitemap
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.e-formulaashwariders.in/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/car</loc><changefreq>monthly</changefreq><priority>0.9</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/team</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/achievements</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/gallery</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/sponsors</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://www.e-formulaashwariders.in/contact</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`;
};

const getRobotsTxt = () => {
  const filePath = path.join(__dirname, 'public', 'robots.txt');
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (err) {
    // Fall back to in-memory robots.txt
  }
  return `User-agent: *
Allow: /
Allow: /about
Allow: /car
Allow: /team
Allow: /achievements
Allow: /gallery
Allow: /sponsors
Allow: /contact
Allow: /favicon.ico
Allow: /favicon.png
Allow: /favicon-*.png
Allow: /apple-touch-icon*.png
Allow: /assets/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /cookies.txt
Disallow: /logs/

Sitemap: https://www.e-formulaashwariders.in/sitemap.xml
`;
};

app.get(['/robots.txt', '/public/robots.txt', '/api/robots.txt', '/api/v1/robots.txt'], (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(getRobotsTxt());
});

app.get(['/sitemap.xml', '/sitemap', '/public/sitemap.xml', '/api/sitemap.xml', '/api/v1/sitemap.xml'], (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(getSitemapXml());
});

app.get(['/', '/index.html', '/public/index.html'], servePublicHtml('index.html'));
app.get(['/team', '/team.html', '/Team.html', '/public/team.html', '/public/Team.html'], servePublicHtml('team.html'));
app.get(['/about', '/about.html', '/About.html', '/public/about.html', '/public/About.html'], servePublicHtml('about.html'));
app.get(['/car', '/car.html', '/Car.html', '/public/car.html', '/public/Car.html'], servePublicHtml('car.html'));
app.get(['/achievements', '/achievements.html', '/Achievements.html', '/public/achievements.html', '/public/Achievements.html'], servePublicHtml('achievements.html'));
app.get(['/gallery', '/gallery.html', '/Gallery.html', '/public/gallery.html', '/public/Gallery.html'], servePublicHtml('gallery.html'));
app.get(['/sponsors', '/sponsors.html', '/Sponsors.html', '/public/sponsors.html', '/public/Sponsors.html'], servePublicHtml('sponsors.html'));
app.get(['/contact', '/contact.html', '/Contact.html', '/public/contact.html', '/public/Contact.html'], servePublicHtml('contact.html'));

// ============================================================
//  ERROR HANDLING  —  must be LAST
// ============================================================

// 404 — catch unmatched routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
