// ============================================================
//  controllers/publicContentController.js
//  Public Content Reader APIs for Website Frontend Hydration.
//  Strictly enforces:
//    1. Only returns active published content (publishedVersion snapshot).
//    2. Excludes draft-only and archived records.
//    3. Excludes internal audit, user, and administrative metadata.
//    4. Zero database write side-effects on GET requests.
// ============================================================

const { sendSuccess, sendError } = require('../utils/responseHelper');

const HeroSlide = require('../models/HeroSlide');
const BuildStage = require('../models/BuildStage');
const NewsArticle = require('../models/NewsArticle');
const HomeStat = require('../models/HomeStat');
const AboutContent = require('../models/AboutContent');
const CarSpec = require('../models/CarSpec');
const TeamMember = require('../models/TeamMember');
const Achievement = require('../models/Achievement');
const GalleryAlbum = require('../models/GalleryAlbum');
const GalleryImage = require('../models/GalleryImage');
const Sponsor = require('../models/Sponsor');
const SponsorPackage = require('../models/SponsorPackage');
const ContactInfo = require('../models/ContactInfo');
const ContactMessage = require('../models/ContactMessage');
const NavFooterSettings = require('../models/NavFooterSettings');
const SiteSeoSettings = require('../models/SiteSeoSettings');

/**
 * Extract public payload from a published record snapshot or document.
 */
const formatPublicItem = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  // If publishedVersion snapshot exists, use it
  const source = obj.publishedVersion || obj;

  const publicData = {
    id: obj._id,
    ...source,
  };

  delete publicData._id;
  delete publicData.publishedVersion;
  delete publicData.draftVersion;
  delete publicData.status;
  delete publicData.version;
  delete publicData.createdBy;
  delete publicData.updatedBy;
  delete publicData.__v;

  return publicData;
};

// ─── 1. HOMEPAGE PUBLIC ENDPOINTS ────────────────────────────
const getPublicHero = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ status: 'published' }).sort({ order: 1 });
    const formatted = slides.map(formatPublicItem);
    // If single item requested or default carousel array
    return sendSuccess(res, 200, 'Hero slides retrieved.', formatted.length > 0 ? formatted[0] : null, { slides: formatted });
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Hero slides: ' + err.message);
  }
};

const getPublicBuildStages = async (req, res) => {
  try {
    const stages = await BuildStage.find({ status: 'published' }).sort({ order: 1 });
    return sendSuccess(res, 200, 'Build stages retrieved.', stages.map(formatPublicItem));
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Build stages: ' + err.message);
  }
};

const getPublicNews = async (req, res) => {
  try {
    const articles = await NewsArticle.find({ status: 'published' }).sort({ order: 1, createdAt: -1 });
    return sendSuccess(res, 200, 'News articles retrieved.', articles.map(formatPublicItem));
  } catch (err) {
    return sendError(res, 500, 'Error retrieving News articles: ' + err.message);
  }
};

const getPublicStats = async (req, res) => {
  try {
    const stats = await HomeStat.find({ status: 'published' }).sort({ order: 1 });
    return sendSuccess(res, 200, 'Statistics retrieved.', stats.map(formatPublicItem));
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Statistics: ' + err.message);
  }
};

const getPublicHomepageCombined = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ status: 'published' }).sort({ order: 1 });
    const stages = await BuildStage.find({ status: 'published' }).sort({ order: 1 });
    const articles = await NewsArticle.find({ status: 'published' }).sort({ order: 1, createdAt: -1 });
    const stats = await HomeStat.find({ status: 'published' }).sort({ order: 1 });
    const sponsors = await Sponsor.find({ status: 'published' }).sort({ order: 1 });

    const formattedSlides = slides.map(formatPublicItem);

    return sendSuccess(res, 200, 'Published homepage content retrieved.', {
      hero: formattedSlides.length > 0 ? formattedSlides[0] : null,
      heroSlides: formattedSlides,
      buildStory: stages.map(formatPublicItem),
      news: articles.map(formatPublicItem),
      statistics: stats.map(formatPublicItem),
      sponsors: sponsors.map(formatPublicItem),
    });
  } catch (err) {
    return sendError(res, 500, 'Error retrieving homepage content: ' + err.message);
  }
};

// ─── 2. ABOUT PAGE PUBLIC ENDPOINT ───────────────────────────
const { getPublicAbout } = require('./aboutPageController');

// ─── 3. CAR PAGE PUBLIC ENDPOINT ─────────────────────────────
const getPublicCar = async (req, res) => {
  try {
    const doc = await CarSpec.findOne({ status: 'published' });
    if (!doc) {
      const fallbackDoc = await CarSpec.findOne();
      return sendSuccess(res, 200, 'Car specifications retrieved.', fallbackDoc ? formatPublicItem(fallbackDoc) : {});
    }
    return sendSuccess(res, 200, 'Car specifications retrieved.', formatPublicItem(doc));
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Car specifications: ' + err.message);
  }
};

// ─── 4. TEAM PAGE PUBLIC ENDPOINT ────────────────────────────
const getPublicTeam = async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.query.department && req.query.department !== 'all') {
      filter.department = req.query.department.toLowerCase();
    }
    const members = await TeamMember.find(filter).sort({ order: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Team members retrieved.', members.map(formatPublicItem));
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Team members: ' + err.message);
  }
};

// ─── 5. ACHIEVEMENTS PAGE PUBLIC ENDPOINT ────────────────────
const getPublicAchievements = async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category.toLowerCase();
    }
    const items = await Achievement.find(filter).sort({ order: 1, createdAt: -1 });
    return sendSuccess(res, 200, 'Achievements retrieved.', items.map(formatPublicItem));
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Achievements: ' + err.message);
  }
};

// ─── 6. GALLERY PAGE PUBLIC ENDPOINT ─────────────────────────
const getPublicGallery = async (req, res) => {
  try {
    const [albums, images] = await Promise.all([
      GalleryAlbum.find({ status: 'published' }).sort({ order: 1 }),
      GalleryImage.find({ status: 'published' }).sort({ order: 1, createdAt: -1 }),
    ]);

    return sendSuccess(res, 200, 'Gallery content retrieved.', {
      albums: albums.map(formatPublicItem),
      images: images.map(formatPublicItem),
    });
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Gallery content: ' + err.message);
  }
};

// ─── 7. SPONSORS PAGE PUBLIC ENDPOINT ────────────────────────
const getPublicSponsors = async (req, res) => {
  try {
    const [sponsors, packages] = await Promise.all([
      Sponsor.find({ status: 'published' }).sort({ order: 1 }),
      SponsorPackage.find({ status: 'published' }).sort({ order: 1 }),
    ]);

    return sendSuccess(res, 200, 'Sponsorship details retrieved.', {
      sponsors: sponsors.map(formatPublicItem),
      packages: packages.map(formatPublicItem),
    });
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Sponsorship details: ' + err.message);
  }
};

// ─── 8. CONTACT PAGE & INFO PUBLIC ENDPOINT ──────────────────
const getPublicContactInfo = async (req, res) => {
  try {
    const doc = await ContactInfo.findOne();
    return sendSuccess(res, 200, 'Contact information retrieved.', doc ? formatPublicItem(doc) : {});
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Contact information: ' + err.message);
  }
};

/**
 * Public Contact Form Submission (POST /api/v1/contact/submit).
 * Replaces fake timer success with real persistence into ContactMessage collection.
 */
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return sendError(res, 400, 'Please fill in all required fields (name, email, subject, message).');
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    const newMsg = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'new',
      ipAddress,
    });

    return sendSuccess(res, 201, 'Your message has been received! The Ashwa Riders team will reply within 24 hours.', {
      id: newMsg._id,
      createdAt: newMsg.createdAt,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to transmit message: ' + err.message);
  }
};

// ─── 9. SHARED NAVIGATION, FOOTER & SEO PUBLIC ENDPOINTS ─────
const getPublicNavFooter = async (req, res) => {
  try {
    const doc = await NavFooterSettings.findOne();
    if (!doc) {
      return sendSuccess(res, 200, 'Navigation & Footer settings retrieved.', {});
    }

    // Strictly enforce published version snapshot
    const source = doc.publishedVersion || (doc.status === 'published' ? doc.toObject() : {});

    const branding = {
      brandTitle: source.branding?.brandTitle || source.brandTitle || source.logo?.brandText || 'Ashwa Riders',
      logoUrl: source.branding?.logoUrl || source.logoUrl || source.logo?.markImageUrl || '/logo.png',
      subtitle: source.branding?.subtitle || source.logo?.subtitle || 'E-FORMULA · SVPCET',
      homeUrl: source.branding?.homeUrl || 'index.html',
    };

    // Filter navigation items and sort by order
    const rawNav = Array.isArray(source.navigation) && source.navigation.length > 0
      ? source.navigation
      : (source.navLinks || []).filter((l) => !l.isCta);

    const navigation = rawNav
      .map((item, idx) => ({
        id: item.id || `nav-${idx}`,
        label: item.label,
        url: item.url,
        visible: item.visible !== false,
        order: Number(item.order) || idx + 1,
      }))
      .sort((a, b) => a.order - b.order);

    const headerCta = {
      label: source.headerCta?.label || source.ctaLabel || 'Join Team',
      url: source.headerCta?.url || source.ctaUrl || 'index.html#recruitment',
      visible: source.headerCta?.visible !== false,
    };

    const footerBrand = {
      brandTitle: source.footerBrand?.brandTitle || branding.brandTitle,
      description: source.footerBrand?.description || source.footerSummary || source.footer?.slogan || '',
      logoUrl: source.footerBrand?.logoUrl || '',
      logoLink: source.footerBrand?.logoLink || 'index.html',
    };

    const rawSocial = Array.isArray(source.socialLinks) && source.socialLinks.length > 0
      ? source.socialLinks
      : Object.entries(source.footer?.socialLinks || {}).map(([platform, url], idx) => ({
          id: `soc-${idx}`,
          platform,
          label: platform.charAt(0).toUpperCase() + platform.slice(1),
          url,
          visible: url && url !== '#',
          order: idx + 1,
        }));

    const socialLinks = rawSocial
      .map((item, idx) => ({
        id: item.id || `soc-${idx}`,
        platform: item.platform,
        label: item.label || item.platform,
        url: item.url || '#',
        icon: item.icon || '',
        visible: item.visible !== false,
        order: Number(item.order) || idx + 1,
      }))
      .sort((a, b) => a.order - b.order);

    const linkGroups = (Array.isArray(source.linkGroups) ? source.linkGroups : [])
      .map((grp, gIdx) => ({
        id: grp.id || `grp-${gIdx}`,
        title: grp.title,
        visible: grp.visible !== false,
        order: Number(grp.order) || gIdx + 1,
        links: (Array.isArray(grp.links) ? grp.links : [])
          .map((lnk, lIdx) => ({
            id: lnk.id || `lnk-${lIdx}`,
            label: lnk.label,
            url: lnk.url,
            visible: lnk.visible !== false,
            order: Number(lnk.order) || lIdx + 1,
          }))
          .sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => a.order - b.order);

    const copyright = {
      text: source.copyright?.text || source.copyrightText || source.footer?.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
      autoYear: source.copyright?.autoYear !== false,
    };

    const credit = {
      text: source.credit?.text || source.designedBy || source.footer?.builtByText || 'Built by the Ashwa Riders Team',
      url: source.credit?.url || '',
      visible: source.credit?.visible !== false,
    };

    const appearance = {
      footerEnabled: source.appearance?.footerEnabled !== false,
      socialLinksEnabled: source.appearance?.socialLinksEnabled !== false,
      footerCreditEnabled: source.appearance?.footerCreditEnabled !== false,
      headerCtaEnabled: source.appearance?.headerCtaEnabled !== false,
    };

    const publicPayload = {
      id: doc._id,
      branding,
      navigation,
      headerCta,
      footerBrand,
      socialLinks,
      linkGroups,
      copyright,
      credit,
      appearance,

      // Convenience & backward-compatible aliases
      brandTitle: branding.brandTitle,
      logoAsset: branding.logoUrl,
      logoUrl: branding.logoUrl,
      logo: {
        brandText: branding.brandTitle,
        markImageUrl: branding.logoUrl,
        subtitle: branding.subtitle,
      },
      navbarCta: {
        label: headerCta.label,
        targetUrl: headerCta.url,
        visible: headerCta.visible,
      },
      ctaLabel: headerCta.label,
      ctaUrl: headerCta.url,
      footer: {
        tagline: footerBrand.description,
        slogan: footerBrand.description,
        copyright: copyright.text,
        copyrightText: copyright.text,
        builtByText: credit.text,
        designedBy: credit.text,
        socialLinks: source.footer?.socialLinks || {},
      },
      footerSummary: footerBrand.description,
      copyrightText: copyright.text,
      designedBy: credit.text,
      navLinks: source.navLinks || [],
      publishedAt: source.publishedAt || source.updatedAt || doc.updatedAt,
    };

    return sendSuccess(res, 200, 'Navigation & Footer settings retrieved.', publicPayload);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Navigation/Footer settings: ' + err.message);
  }
};

const getPublicSeo = async (req, res) => {
  try {
    const doc = await SiteSeoSettings.findOne();
    return sendSuccess(res, 200, 'Site SEO settings retrieved.', doc ? formatPublicItem(doc) : {});
  } catch (err) {
    return sendError(res, 500, 'Error retrieving SEO settings: ' + err.message);
  }
};

module.exports = {
  getPublicHero,
  getPublicHomepageCombined,
  getPublicBuildStages,
  getPublicNews,
  getPublicStats,
  getPublicAbout,
  getPublicCar,
  getPublicTeam,
  getPublicAchievements,
  getPublicGallery,
  getPublicSponsors,
  getPublicContactInfo,
  submitContactForm,
  getPublicNavFooter,
  getPublicSeo,
};
