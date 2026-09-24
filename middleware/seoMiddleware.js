// ============================================================
//  middleware/seoMiddleware.js
//  Server-Side SEO Meta Tag Injector Middleware
//  Interprets incoming HTML requests and injects published SiteSeoSettings
//  directly into the initial server-delivered HTML response.
// ============================================================

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const SiteSeoSettings = require('../models/SiteSeoSettings');

const seoMiddleware = async (req, res, next) => {
  // Only intercept GET requests for HTML pages (exclude API, static assets, admin)
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/uploads')) return next();

  // Determine target HTML file
  let filePath = '';
  let pageKey = 'homeTitle';

  const p = (req.path.toLowerCase().replace(/^\/public/, '') || '/');
  if (p === '/' || p === '/index.html') {
    filePath = path.join(__dirname, '../public/index.html');
    pageKey = 'homeTitle';
  } else if (p === '/about' || p === '/about.html') {
    filePath = path.join(__dirname, '../public/about.html');
    pageKey = 'aboutTitle';
  } else if (p === '/car' || p === '/car.html') {
    filePath = path.join(__dirname, '../public/car.html');
    pageKey = 'carTitle';
  } else if (p === '/team' || p === '/team.html') {
    filePath = path.join(__dirname, '../public/team.html');
    if (!fs.existsSync(filePath)) {
      const altPath = path.join(__dirname, '../public/Team.html');
      if (fs.existsSync(altPath)) filePath = altPath;
    }
    pageKey = 'teamTitle';
  } else if (p === '/achievements' || p === '/achievements.html') {
    filePath = path.join(__dirname, '../public/achievements.html');
    pageKey = 'achievementsTitle';
  } else if (p === '/gallery' || p === '/gallery.html') {
    filePath = path.join(__dirname, '../public/gallery.html');
    pageKey = 'galleryTitle';
  } else if (p === '/sponsors' || p === '/sponsors.html') {
    filePath = path.join(__dirname, '../public/sponsors.html');
    pageKey = 'sponsorsTitle';
  } else if (p === '/contact' || p === '/contact.html') {
    filePath = path.join(__dirname, '../public/contact.html');
    pageKey = 'contactTitle';
  } else if (p === '/my-applications' || p === '/my-applications.html') {
    filePath = path.join(__dirname, '../public/my-applications.html');
    pageKey = 'homeTitle';
  } else {
    return next();
  }

  if (!fs.existsSync(filePath)) return next();

  try {
    let seoDoc = null;
    if (mongoose.connection.readyState === 1) {
      seoDoc = await SiteSeoSettings.findOne({ status: 'published' }).maxTimeMS(2500) || await SiteSeoSettings.findOne().maxTimeMS(2500);
    }
    const seo = seoDoc ? (seoDoc.publishedVersion || seoDoc) : {};

    const pageTitle = seo[pageKey] || seo.defaultTitle || 'Ashwa Riders — Formula Student Electric Team';
    const pageDesc = seo.defaultDescription || 'Official website of Ashwa Riders, Formula Student Electric race team representing SVPCET Nagpur.';
    const ogImg = seo.defaultOgImage || '/logo.png.png';
    const canonical = (seo.canonicalUrl || 'http://localhost:5000') + req.path;

    let html = fs.readFileSync(filePath, 'utf8');

    // Replace Title Tag
    html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

    // Replace or Insert Meta Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta name="description".*?>/i, `<meta name="description" content="${pageDesc}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${pageDesc}" />\n</head>`);
    }

    // Insert / Replace OG Tags, Favicon & Canonical Link
    const extraMeta = `
  <link rel="icon" type="image/png" href="/favicon.png" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${pageDesc}" />
  <meta property="og:image" content="${ogImg}" />
  <link rel="canonical" href="${canonical}" />
`;
    // Inject initial SSR team data if serving Team page
    if ((p === '/team' || p === '/team.html') && mongoose.connection.readyState === 1) {
      try {
        const TeamPageContent = require('../models/TeamPageContent');
        const TeamMember = require('../models/TeamMember');
        const teamDoc = await TeamPageContent.findOne().maxTimeMS(2500);
        const source = (teamDoc && teamDoc.publishedVersion) ? teamDoc.publishedVersion : (teamDoc || {});
        const teamMembers = await TeamMember.find({ isArchived: { $ne: true }, status: 'published', isVisible: { $ne: false } }).sort({ order: 1 }).maxTimeMS(2500);
        const { formatMemberItem } = require('../controllers/teamPageController');
        const teamPayload = {
          settings: source.settings || {},
          hero: source.hero || {},
          membersSection: source.membersSection || {},
          filters: source.filters || [],
          members: teamMembers.map(m => formatMemberItem(m, false)),
          cta: source.cta || {},
        };
        html = html.replace('</head>', `  <script id="__TEAM_PRELOAD__">window.__INITIAL_TEAM_DATA__ = ${JSON.stringify(teamPayload)};</script>\n</head>`);
      } catch (err) {
        console.warn('Initial team SSR preload note:', err.message);
      }
    }

    // Inject initial SSR gallery data if serving Gallery page
    if ((p === '/gallery' || p === '/gallery.html') && mongoose.connection.readyState === 1) {
      try {
        const GalleryPageContent = require('../models/GalleryPageContent');
        const GalleryAlbum = require('../models/GalleryAlbum');
        const GalleryImage = require('../models/GalleryImage');
        const { formatMediaItem, formatAlbumItem } = require('../controllers/galleryPageController');

        const galleryDoc = await GalleryPageContent.findOne().maxTimeMS(2500);
        const source = (galleryDoc && galleryDoc.publishedVersion) ? galleryDoc.publishedVersion : (galleryDoc || {});

        const albums = await GalleryAlbum.find({ status: 'published', isVisible: { $ne: false } }).sort({ order: 1 }).maxTimeMS(2500);
        const media = await GalleryImage.find({ status: 'published', isVisible: { $ne: false } }).sort({ order: 1, createdAt: -1 }).maxTimeMS(2500);

        const albumCounts = {};
        const categoryCounts = { all: media.length, image: 0, video: 0 };
        media.forEach(m => {
          if (m.album) {
            const aId = m.album.toString();
            albumCounts[aId] = (albumCounts[aId] || 0) + 1;
          }
          const cat = (m.category || 'image').toLowerCase();
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          const mType = (m.mediaType || 'image').toLowerCase();
          if (mType === 'image') categoryCounts.image = (categoryCounts.image || 0) + 1;
          if (mType === 'video') categoryCounts.video = (categoryCounts.video || 0) + 1;
        });

        const activeCategories = (source.categories && source.categories.length > 0)
          ? source.categories.filter(c => c.isVisible !== false).sort((a,b) => (a.order || 0) - (b.order || 0))
          : [
              { id: 'all', label: 'All', order: 0, isVisible: true },
              { id: 'image', label: 'Images', order: 1, isVisible: true },
              { id: 'video', label: 'Videos', order: 2, isVisible: true },
              { id: 'competition', label: 'Competition', order: 3, isVisible: true },
              { id: 'workshop', label: 'Workshop', order: 4, isVisible: true },
              { id: 'testing', label: 'Testing', order: 5, isVisible: true },
              { id: 'events', label: 'Events', order: 6, isVisible: true },
            ];

        const categoriesWithCounts = activeCategories.map(c => ({
          ...c,
          count: categoryCounts[c.id.toLowerCase()] || 0,
        }));

        const formattedAlbums = albums.map(a => formatAlbumItem(a, albumCounts[a._id.toString()] || 0));
        const formattedMedia = media.map(m => formatMediaItem(m, false));

        const galleryPayload = {
          settings: source.settings || {},
          hero: source.hero || {},
          categories: categoriesWithCounts,
          albums: formattedAlbums,
          media: formattedMedia,
          images: formattedMedia,
          cta: source.cta || {},
        };

        html = html.replace('</head>', `  <script id="__GALLERY_PRELOAD__">window.__INITIAL_GALLERY_DATA__ = ${JSON.stringify(galleryPayload)};</script>\n</head>`);
      } catch (err) {
        console.warn('Initial gallery SSR preload note:', err.message);
      }
    }

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    return res.send(html);
  } catch (err) {
    console.error('SEO middleware error:', err);
    return next();
  }
};

module.exports = seoMiddleware;
