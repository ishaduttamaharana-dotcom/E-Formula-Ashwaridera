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

  // Determine target HTML file and page key
  let filePath = '';
  let pageId = 'home';
  let cleanPath = '/';

  const p = (req.path.toLowerCase().replace(/^\/public/, '') || '/');
  if (p === '/' || p === '/index.html') {
    filePath = path.join(__dirname, '../public/index.html');
    pageId = 'home';
    cleanPath = '/';
  } else if (p === '/about' || p === '/about.html') {
    filePath = path.join(__dirname, '../public/about.html');
    pageId = 'about';
    cleanPath = '/about';
  } else if (p === '/car' || p === '/car.html') {
    filePath = path.join(__dirname, '../public/car.html');
    pageId = 'car';
    cleanPath = '/car';
  } else if (p === '/team' || p === '/team.html') {
    filePath = path.join(__dirname, '../public/team.html');
    if (!fs.existsSync(filePath)) {
      const altPath = path.join(__dirname, '../public/Team.html');
      if (fs.existsSync(altPath)) filePath = altPath;
    }
    pageId = 'team';
    cleanPath = '/team';
  } else if (p === '/achievements' || p === '/achievements.html') {
    filePath = path.join(__dirname, '../public/achievements.html');
    pageId = 'achievements';
    cleanPath = '/achievements';
  } else if (p === '/gallery' || p === '/gallery.html') {
    filePath = path.join(__dirname, '../public/gallery.html');
    pageId = 'gallery';
    cleanPath = '/gallery';
  } else if (p === '/sponsors' || p === '/sponsors.html') {
    filePath = path.join(__dirname, '../public/sponsors.html');
    pageId = 'sponsors';
    cleanPath = '/sponsors';
  } else if (p === '/contact' || p === '/contact.html') {
    filePath = path.join(__dirname, '../public/contact.html');
    pageId = 'contact';
    cleanPath = '/contact';
  } else if (p === '/my-applications' || p === '/my-applications.html') {
    filePath = path.join(__dirname, '../public/my-applications.html');
    pageId = 'home';
    cleanPath = '/';
  } else {
    return next();
  }

  if (!fs.existsSync(filePath)) return next();

  const PAGE_DEFAULTS = {
    home: {
      title: 'E-Formula Ashwa Riders | Formula Student Electric Racing Team',
      desc: "Official website of E-Formula Ashwa Riders, Central India's premier Formula Student Electric racing team representing SVPCET Nagpur. Discover our car, team, and innovations.",
      titleKey: 'homeTitle',
      descKey: 'homeDescription',
    },
    about: {
      title: 'About Us — E-Formula Ashwa Riders | Formula Student EV Legacy',
      desc: "Learn about E-Formula Ashwa Riders' origin, engineering heritage, vision, and mission building sustainable electric race vehicles at SVPCET Nagpur.",
      titleKey: 'aboutTitle',
      descKey: 'aboutDescription',
    },
    car: {
      title: 'The Car — Technical Specifications | E-Formula Ashwa Riders',
      desc: "Explore the technical specifications, telemetry, powertrain, battery pack, chassis, and aerodynamics of E-Formula Ashwa Riders' Formula Student electric race car.",
      titleKey: 'carTitle',
      descKey: 'carDescription',
    },
    team: {
      title: 'Our Team — Student Engineers & Leadership | E-Formula Ashwa Riders',
      desc: 'Meet the student engineers, department heads, drivers, and faculty advisors behind E-Formula Ashwa Riders at SVPCET Nagpur.',
      titleKey: 'teamTitle',
      descKey: 'teamDescription',
    },
    achievements: {
      title: 'Achievements & Formula Bharat Milestones | E-Formula Ashwa Riders',
      desc: 'Review competition milestones, Formula Bharat ranks, design awards, and engineering accomplishments of the E-Formula Ashwa Riders electric racing team.',
      titleKey: 'achievementsTitle',
      descKey: 'achievementsDescription',
    },
    gallery: {
      title: 'Media Gallery — Track, Workshop & Events | E-Formula Ashwa Riders',
      desc: 'Explore photos, videos, testing runs, and workshop action shots capturing the journey of E-Formula Ashwa Riders Formula Student EV team.',
      titleKey: 'galleryTitle',
      descKey: 'galleryDescription',
    },
    sponsors: {
      title: 'Corporate Sponsors & Partnership | E-Formula Ashwa Riders',
      desc: 'Partner with E-Formula Ashwa Riders. Explore corporate sponsorship packages, industry collaboration benefits, and download our official team brochure.',
      titleKey: 'sponsorsTitle',
      descKey: 'sponsorsDescription',
    },
    contact: {
      title: 'Contact Race Control — Get in Touch | E-Formula Ashwa Riders',
      desc: 'Contact E-Formula Ashwa Riders for sponsorships, team recruitment, press inquiries, or workshop visits at SVPCET Nagpur.',
      titleKey: 'contactTitle',
      descKey: 'contactDescription',
    },
  };

  try {
    let seoDoc = null;
    if (mongoose.connection.readyState === 1) {
      seoDoc = await SiteSeoSettings.findOne({ status: 'published' }).maxTimeMS(2500) || await SiteSeoSettings.findOne().maxTimeMS(2500);
    }
    const seo = seoDoc ? (seoDoc.publishedVersion || seoDoc) : {};

    const pageDef = PAGE_DEFAULTS[pageId] || PAGE_DEFAULTS.home;
    const pageTitle = seo[pageDef.titleKey] || (pageId === 'home' ? seo.defaultTitle : null) || pageDef.title;
    const pageDesc = seo[pageDef.descKey] || (pageId === 'home' ? seo.defaultDescription : null) || pageDef.desc;
    const ogImg = seo.defaultOgImage || 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png';

    const defaultBase = 'https://www.e-formulaashwariders.in';
    const rawBase = (seo.canonicalUrl || process.env.CANONICAL_URL || defaultBase).trim().replace(/\/+$/, '');
    const canonicalBase = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`;
    const canonicalUrl = cleanPath === '/' ? `${canonicalBase}/` : `${canonicalBase}${cleanPath}`;

    let html = fs.readFileSync(filePath, 'utf8');

    // Replace Title Tag
    html = html.replace(/<title>.*?<\/title>/i, `<title>${pageTitle}</title>`);

    // Replace or Insert Meta Description
    if (html.includes('<meta name="description"')) {
      html = html.replace(/<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${pageDesc}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${pageDesc}" />\n</head>`);
    }

    // Replace or Insert Canonical URL
    if (html.includes('<link rel="canonical"')) {
      html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
    }

    // Replace or Insert Robots Tag
    if (!html.includes('<meta name="robots"')) {
      html = html.replace('</head>', `  <meta name="robots" content="index, follow" />\n</head>`);
    }

    // Update OpenGraph Tags
    if (html.includes('property="og:title"')) {
      html = html.replace(/<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${pageTitle}" />`);
    }
    if (html.includes('property="og:description"')) {
      html = html.replace(/<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${pageDesc}" />`);
    }
    if (html.includes('property="og:url"')) {
      html = html.replace(/<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`);
    }
    if (html.includes('property="og:image"') && ogImg) {
      html = html.replace(/<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${ogImg}" />`);
    }

    // Update Twitter Tags
    if (html.includes('name="twitter:title"')) {
      html = html.replace(/<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${pageTitle}" />`);
    }
    if (html.includes('name="twitter:description"')) {
      html = html.replace(/<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${pageDesc}" />`);
    }
    if (html.includes('name="twitter:url"')) {
      html = html.replace(/<meta\s+name=["']twitter:url["'][^>]*>/i, `<meta name="twitter:url" content="${canonicalUrl}" />`);
    }
    if (html.includes('name="twitter:image"') && ogImg) {
      html = html.replace(/<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${ogImg}" />`);
    }
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
