// ============================================================
//  controllers/sponsorPageController.js
//  Unified Controller for Sponsor Page Control Center.
//  Controls:
//    01. HEADER & SETTINGS
//    02. SPONSOR RAIL (Moving logos, speed, direction, pause on hover)
//    03. SPONSORSHIP CONTENT:
//        - Hero / Intro (media, headings, CTA buttons)
//        - Sponsorship Tiers (cards, benefits, popular ribbon)
//        - Sponsor Enquiry & Form (contact details, brochure, dynamic tiers)
//    04. FOOTER (Shared reference)
//  Draft / Preview / Publish lifecycle with lightweight JSON only.
// ============================================================

const path = require('path');
const fs = require('fs');
const https = require('https');
const SponsorPageContent = require('../models/SponsorPageContent');
const SponsorRequest = require('../models/SponsorRequest');
const NavFooterSettings = require('../models/NavFooterSettings');
const MediaAsset = require('../models/MediaAsset');
const { getCloudinaryDocumentDownloadUrl } = require('../services/cloudinaryService');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');


const DEFAULT_SPONSORS = [
  { id: 'sp-1', name: 'E-Formula Ashwa Riders', tier: 'Title', logoUrl: '', altText: 'E-Formula Ashwa Riders', websiteUrl: '', icon: 'fas fa-bolt', order: 1, visible: true },
  { id: 'sp-2', name: 'MORP', tier: 'Gold', logoUrl: '', altText: 'MORP', websiteUrl: '', icon: 'fas fa-cog', order: 2, visible: true },
  { id: 'sp-3', name: 'MATLAB', tier: 'Gold', logoUrl: '', altText: 'MATLAB', websiteUrl: '', icon: 'fas fa-chart-simple', order: 3, visible: true },
  { id: 'sp-4', name: 'Carbonext', tier: 'Silver', logoUrl: '', altText: 'Carbonext', websiteUrl: '', icon: 'fas fa-leaf', order: 4, visible: true },
  { id: 'sp-5', name: 'EIPRISM', tier: 'Silver', logoUrl: '', altText: 'EIPRISM', websiteUrl: '', icon: 'fas fa-cube', order: 5, visible: true },
  { id: 'sp-11', name: 'Vashi INTEGRATE SOLUTIONS', tier: 'Associate', logoUrl: '', altText: 'Vashi INTEGRATE SOLUTIONS', websiteUrl: '', icon: 'fas fa-wave-square', order: 6, visible: true },
  { id: 'sp-12', name: 'PERFECTIO', tier: 'Associate', logoUrl: '', altText: 'PERFECTIO', websiteUrl: '', icon: 'fas fa-star', order: 7, visible: true },
  { id: 'sp-13', name: 'ADAPT.IMPROVISE.OVERCOME', tier: 'Associate', logoUrl: '', altText: 'ADAPT.IMPROVISE.OVERCOME', websiteUrl: '', icon: 'fas fa-arrows-rotate', order: 8, visible: true },
];

const DEFAULT_TIERS = [
  {
    id: 'tier-bronze',
    name: 'Bronze',
    title: 'Associate Sponsor',
    description: 'Cash or in-kind support',
    benefits: [
      'Logo on team website',
      'Mention in social media posts',
      'Certificate of association',
    ],
    buttonText: 'Get In Touch',
    buttonUrl: '#sponsor-form',
    isPopular: false,
    popularRibbonText: 'Popular',
    badgeColor: '#D97706',
    order: 1,
    visible: true,
  },
  {
    id: 'tier-silver',
    name: 'Silver',
    title: 'Silver Sponsor',
    description: 'Cash, components, or services',
    benefits: [
      'Everything in Bronze',
      'Logo on car bodywork',
      'Logo on team kit',
      'Dedicated social media feature',
    ],
    buttonText: 'Get In Touch',
    buttonUrl: '#sponsor-form',
    isPopular: false,
    popularRibbonText: 'Popular',
    badgeColor: '#9CA3AF',
    order: 2,
    visible: true,
  },
  {
    id: 'tier-gold',
    name: 'Gold',
    title: 'Powertrain Partner',
    description: 'Larger cash or component sponsorship',
    benefits: [
      'Everything in Silver',
      'Prominent logo placement on car',
      'Invitation to workshop visits',
      'Priority access to recruiting events',
      'Feature in competition press kit',
    ],
    buttonText: 'Get In Touch',
    buttonUrl: '#sponsor-form',
    isPopular: true,
    popularRibbonText: 'Popular',
    badgeColor: '#F59E0B',
    order: 3,
    visible: true,
  },
  {
    id: 'tier-title',
    name: 'Title',
    title: 'Title Sponsor',
    description: 'Full-season primary partnership',
    benefits: [
      'Everything in Gold',
      'Primary logo position on car and livery',
      'Co-branding across all team materials',
      'First right of refusal next season',
      'On-site presence at Formula Bharat',
    ],
    buttonText: 'Get In Touch',
    buttonUrl: '#sponsor-form',
    isPopular: false,
    popularRibbonText: 'Popular',
    badgeColor: '#F25912',
    order: 4,
    visible: true,
  },
];

const isObsoleteCategory = (str) => {
  if (!str || typeof str !== 'string') return false;
  const s = str.toLowerCase().trim();
  return (
    s.includes('technical') ||
    s.includes('education') ||
    s.includes('educational') ||
    s.includes('media partner') ||
    s.includes('media-partner') ||
    s === 'media'
  );
};

/**
 * Retrieve or initialize the singleton SponsorPageContent document.
 */
const getOrSeedSponsorDoc = async () => {
  let doc = await SponsorPageContent.findOne();
  if (doc) {
    let needsSave = false;
    // Clean obsolete rail items
    if (doc.rail && Array.isArray(doc.rail.items)) {
      const filtered = doc.rail.items.filter((item) => !isObsoleteCategory(item.tier));
      if (filtered.length !== doc.rail.items.length) {
        doc.rail.items = filtered;
        needsSave = true;
      }
    }
    // Clean obsolete tier titles if any
    if (doc.tiersSection && Array.isArray(doc.tiersSection.tiers)) {
      doc.tiersSection.tiers.forEach((t) => {
        if (isObsoleteCategory(t.title)) {
          t.title = 'Silver Sponsor';
          needsSave = true;
        }
      });
    }
    if (needsSave) {
      doc.draftVersion = JSON.parse(JSON.stringify(doc.toObject()));
      doc.publishedVersion = JSON.parse(JSON.stringify(doc.toObject()));
      doc.markModified('rail');
      doc.markModified('tiersSection');
      doc.markModified('draftVersion');
      doc.markModified('publishedVersion');
      await doc.save();
    }
    return doc;
  }

  console.log('⚡ Initializing Sponsor Page Control Center document with authentic defaults...');

  const initialDoc = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    settings: {
      pageTitle: 'Ashwa Riders — Become A Sponsor',
      seoTitle: 'Sponsor Us | Ashwa Riders Formula Student Electric',
      seoDescription: 'Partner with Ashwa Riders, SVPCET Formula Student Electric racing team. Explore sponsorship tiers and corporate collaboration.',
      ogImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg',
      canonicalUrl: 'sponsors.html',
      visible: true,
    },
    rail: {
      visible: true,
      direction: 'right-to-left',
      speed: 32,
      pauseOnHover: true,
      animationEnabled: true,
      items: DEFAULT_SPONSORS,
    },
    hero: {
      visible: true,
      eyebrow: 'Partner With Us',
      eyebrowIcon: 'fas fa-handshake',
      headingLine1: 'Become A',
      headingHighlight: 'Sponsor',
      description: 'Put your brand on Tarkshya, our electric Formula Student car. Every season we race at Formula Bharat — your support drives us forward.',
      bgImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg',
      videoUrl: '',
      overlay: true,
      overlayStrength: 72,
      textAlignment: 'left',
      buttonPrimaryText: 'Start Here',
      buttonPrimaryUrl: '#sponsor-form',
      buttonPrimaryIcon: 'fas fa-handshake',
      buttonBrochureText: 'Brochure',
      buttonBrochureUrl: '',
      buttonBrochureVisible: true,
    },
    tiersSection: {
      visible: true,
      eyebrow: 'Sponsorship Tiers',
      eyebrowIcon: 'fas fa-layer-group',
      headingLine1: 'Choose Your',
      headingHighlight: 'Level',
      description: 'A starting point for a conversation — every partnership is tailored to what you and the team need.',
      bgImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      overlayStrength: 82,
      tiers: DEFAULT_TIERS,
    },
    enquirySection: {
      visible: true,
      eyebrow: 'Get Started',
      eyebrowIcon: 'fas fa-paper-plane',
      headingLine1: 'Become A',
      headingHighlight: 'Sponsor',
      description: "Tell us about your organisation and we'll get back to you with a custom proposal.",
      contactHeading: "Let's Talk",
      contactDescription: 'Cash, components, services, or expertise — if it helps us build a better car, we want to hear from you. Fill out the form and our sponsorship team will follow up within a few days.',
      email: 'sponsors@ashwariders.in',
      phone: '+91 00000 00000',
      address: 'St. Vincent Pallotti CET, Nagpur',
      brochureText: 'Download sponsorship brochure',
      brochureUrl: '',
      brochureVisible: true,
      formTitle: 'Sponsorship Enquiry',
      formDescription: '',
      submitButtonText: 'Send Enquiry',
      successMessage: 'Thank you for your enquiry! Our sponsorship team will get back to you shortly.',
      errorMessage: 'Failed to submit enquiry. Please check your inputs and try again.',
    },
  };

  initialDoc.draftVersion = JSON.parse(JSON.stringify(initialDoc));
  initialDoc.publishedVersion = JSON.parse(JSON.stringify(initialDoc));

  doc = await SponsorPageContent.create(initialDoc);
  return doc;
};

// ============================================================
//  1. PUBLIC & PREVIEW SPONSOR ENDPOINT
// ============================================================

/**
 * GET /api/v1/sponsors
 * Returns public or preview content for sponsors.html.
 */
const getPublicSponsorContent = async (req, res) => {
  try {
    const isPreview = req.query.preview === 'true' || req.query.draft === 'true';
    const doc = await getOrSeedSponsorDoc();

    const source = isPreview
      ? (doc.draftVersion || doc.toObject())
      : (doc.publishedVersion || doc.toObject());

    // Filter rail items by visibility and sort by order
    let rawRailItems = [...(source.rail?.items || DEFAULT_SPONSORS)];

    // Check standalone Sponsor collection to bridge any direct resource additions
    try {
      const Sponsor = require('../models/Sponsor');
      const standaloneSponsors = await Sponsor.find(
        isPreview ? { status: { $ne: 'archived' } } : { status: 'published' }
      ).lean();

      standaloneSponsors.forEach((sp) => {
        const existingIdx = rawRailItems.findIndex(
          (r) => (r.id && String(r.id) === String(sp._id)) || (r.name && r.name.toLowerCase() === sp.name.toLowerCase())
        );
        const isItemVisible = sp.visible !== false && sp.showOnHomepage !== false && sp.status !== 'archived';
        const itemObj = {
          id: String(sp._id),
          name: sp.name,
          tier: sp.tier || 'Gold',
          logoUrl: sp.logoUrl || '',
          altText: sp.name,
          websiteUrl: sp.websiteUrl || '',
          icon: sp.icon || 'fas fa-bolt',
          order: sp.order !== undefined ? sp.order : 99,
          visible: isItemVisible,
        };

        if (existingIdx >= 0) {
          rawRailItems[existingIdx] = {
            ...rawRailItems[existingIdx],
            ...itemObj,
            visible: isItemVisible && rawRailItems[existingIdx].visible !== false,
          };
        } else {
          rawRailItems.push(itemObj);
        }
      });
    } catch (e) {}

    const railItems = rawRailItems
      .filter((item) => !isObsoleteCategory(item.tier))
      .filter((item) => isPreview || item.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter tiers by visibility and sort by order.
    // IMPORTANT: [] is truthy in JS, so || DEFAULT_TIERS won't fire for an empty array.
    // We must check .length explicitly to fall back to defaults.
    let rawTiers = (source.tiersSection?.tiers && source.tiersSection.tiers.length > 0)
      ? source.tiersSection.tiers
      : null;

    // If publishedVersion has no tiers but the live doc root does, use the live tiers
    // and repair the publishedVersion snapshot in the DB so future calls are correct.
    if (!rawTiers) {
      const liveTiers = doc.tiersSection?.tiers;
      if (liveTiers && liveTiers.length > 0) {
        rawTiers = liveTiers;
        // Repair: patch publishedVersion with the live tiersSection
        try {
          const snapshot = JSON.parse(JSON.stringify(doc.toObject()));
          doc.publishedVersion = snapshot;
          doc.markModified('publishedVersion');
          await doc.save();
          console.log('⚡ Auto-repaired publishedVersion.tiersSection.tiers from live doc.');
        } catch (repairErr) {
          console.warn('Could not auto-repair publishedVersion:', repairErr.message);
        }
      } else {
        rawTiers = DEFAULT_TIERS;
        console.log('⚡ Using DEFAULT_TIERS as fallback — DB has no tiers in either snapshot or live doc.');
      }
    }

    const tiers = rawTiers
      .filter((tier) => !isObsoleteCategory(tier.name))
      .map((tier) => ({
        ...tier,
        title: isObsoleteCategory(tier.title) ? 'Silver Sponsor' : tier.title,
      }))
      .filter((tier) => isPreview || tier.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const canonicalBrochureUrl = '/api/v1/sponsors/brochure';
    const publicHero = { ...(source.hero || {}) };
    if (publicHero.buttonBrochureUrl && (publicHero.buttonBrochureUrl.includes('cloudinary.com') || publicHero.buttonBrochureUrl.includes('/assets/docs/'))) {
      publicHero.buttonBrochureUrl = canonicalBrochureUrl;
    } else if (!publicHero.buttonBrochureUrl) {
      publicHero.buttonBrochureUrl = canonicalBrochureUrl;
    }

    const publicEnquiry = { ...(source.enquirySection || {}) };
    if (publicEnquiry.brochureUrl && (publicEnquiry.brochureUrl.includes('cloudinary.com') || publicEnquiry.brochureUrl.includes('/assets/docs/'))) {
      publicEnquiry.brochureUrl = canonicalBrochureUrl;
    } else if (!publicEnquiry.brochureUrl) {
      publicEnquiry.brochureUrl = canonicalBrochureUrl;
    }

    const responseData = {
      settings: source.settings || {},
      rail: {
        ...(source.rail || {}),
        items: railItems,
      },
      sponsors: railItems,
      hero: publicHero,
      tiersSection: {
        ...(source.tiersSection || {}),
        tiers,
      },
      enquirySection: publicEnquiry,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      isPreview,
    };

    return sendSuccess(res, 200, 'Sponsorship details retrieved successfully.', responseData);
  } catch (err) {
    console.error('getPublicSponsorContent Error:', err);
    return sendError(res, 500, 'Error retrieving sponsorship details: ' + err.message);
  }
};

// ============================================================
//  2. ADMIN CONTROL CENTER ENDPOINTS
// ============================================================

/**
 * GET /api/v1/admin/sponsors/page
 * Returns entire draft, published state, and shared footer summary for Admin CMS.
 */
const getAdminSponsorContent = async (req, res) => {
  try {
    const doc = await getOrSeedSponsorDoc();

    // Fetch shared footer summary for reference
    let footerSummary = {
      copyrightText: '© 2026 Ashwa Riders — Formula Student Team',
      email: 'sponsors@ashwariders.in',
      phone: '+91 00000 00000',
      address: 'St. Vincent Pallotti College of Engineering & Technology, Nagpur',
    };
    try {
      const navDoc = await NavFooterSettings.findOne();
      if (navDoc && navDoc.footer) {
        footerSummary = {
          copyrightText: navDoc.footer.copyrightText || footerSummary.copyrightText,
          email: navDoc.footer.contactEmail || footerSummary.email,
          phone: navDoc.footer.contactPhone || footerSummary.phone,
          address: navDoc.footer.address || footerSummary.address,
        };
      }
    } catch (_) { }

    return sendSuccess(res, 200, 'Sponsor Control Center content loaded.', {
      page: doc,
      footerSummary,
    });
  } catch (err) {
    console.error('getAdminSponsorContent Error:', err);
    return sendError(res, 500, 'Failed to load Sponsor Control Center: ' + err.message);
  }
};

/**
 * PATCH / PUT /api/v1/admin/sponsors/page
 * Updates the draft state of the Sponsor Page Control Center.
 */
const updateSponsorDraft = async (req, res) => {
  try {
    const doc = await getOrSeedSponsorDoc();
    const payload = req.body || {};

    if (payload.rail?.items && Array.isArray(payload.rail.items)) {
      const hasObsolete = payload.rail.items.some((i) => isObsoleteCategory(i.tier));
      if (hasObsolete) {
        return sendError(res, 400, 'Technical, Education, and Media partner categories are permanently removed and cannot be added.');
      }
    }
    if (payload.tiersSection?.tiers && Array.isArray(payload.tiersSection.tiers)) {
      const hasObsolete = payload.tiersSection.tiers.some((t) => isObsoleteCategory(t.name) || isObsoleteCategory(t.title));
      if (hasObsolete) {
        return sendError(res, 400, 'Technical, Education, and Media partner categories are permanently removed and cannot be added.');
      }
    }

    // Build clean draft object (only metadata and string URLs)
    const newDraft = {
      settings: payload.settings || doc.draftVersion?.settings || doc.settings,
      rail: payload.rail || doc.draftVersion?.rail || doc.rail,
      hero: payload.hero || doc.draftVersion?.hero || doc.hero,
      tiersSection: payload.tiersSection || doc.draftVersion?.tiersSection || doc.tiersSection,
      enquirySection: payload.enquirySection || doc.draftVersion?.enquirySection || doc.enquirySection,
    };

    doc.draftVersion = newDraft;
    doc.lastEditedAt = new Date();

    if (payload.publishNow || req.query.publish === 'true') {
      doc.publishedVersion = JSON.parse(JSON.stringify(newDraft));
      doc.settings = newDraft.settings;
      doc.rail = newDraft.rail;
      doc.hero = newDraft.hero;
      doc.tiersSection = newDraft.tiersSection;
      doc.enquirySection = newDraft.enquirySection;
      doc.status = 'published';
      doc.version = (doc.version || 1) + 1;
      doc.lastPublishedAt = new Date();
    } else {
      doc.status = 'draft';
    }

    await doc.save();

    return sendSuccess(res, 200, 'Sponsor Page saved successfully.', {
      status: doc.status,
      version: doc.version,
      lastEditedAt: doc.lastEditedAt,
      lastPublishedAt: doc.lastPublishedAt,
      draftVersion: doc.draftVersion,
      publishedVersion: doc.publishedVersion,
    });
  } catch (err) {
    console.error('updateSponsorDraft Error:', err);
    return sendError(res, 500, 'Failed to save Sponsor draft: ' + err.message);
  }
};

/**
 * POST /api/v1/admin/sponsors/page/publish
 * Promotes current draft state to live published version.
 */
const publishSponsor = async (req, res) => {
  try {
    const doc = await getOrSeedSponsorDoc();

    const snapshot = doc.draftVersion
      ? JSON.parse(JSON.stringify(doc.draftVersion))
      : JSON.parse(JSON.stringify(doc.toObject()));

    doc.publishedVersion = snapshot;
    doc.settings = snapshot.settings || doc.settings;
    doc.rail = snapshot.rail || doc.rail;
    doc.hero = snapshot.hero || doc.hero;
    doc.tiersSection = snapshot.tiersSection || doc.tiersSection;
    doc.enquirySection = snapshot.enquirySection || doc.enquirySection;

    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    await doc.save();

    await logActivity({
      user: req.user,
      action: 'PUBLISH',
      resource: 'SponsorPageContent',
      resourceId: doc._id,
      summary: `Published live Sponsor Page Control Center (v${doc.version})`,
      req,
    });

    return sendSuccess(res, 200, 'Sponsor Page published to live website!', {
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      publishedVersion: doc.publishedVersion,
    });
  } catch (err) {
    console.error('publishSponsor Error:', err);
    return sendError(res, 500, 'Failed to publish Sponsor Page: ' + err.message);
  }
};

// ============================================================
//  3. PUBLIC ENQUIRY SUBMISSION (Direct to SponsorRequest Inbox)
// ============================================================

/**
 * POST /api/v1/sponsors/enquiry
 * Public submission of sponsor enquiry form.
 * Creates a SponsorRequest document in MongoDB with status 'Pending'.
 */
const submitPublicSponsorEnquiry = async (req, res) => {
  try {
    const { name, organisation, companyName, email, phone, tier, message } = req.body;

    const finalName = (name || '').trim();
    const finalOrg = (organisation || companyName || '').trim();
    const finalEmail = (email || '').trim().toLowerCase();
    const finalPhone = (phone || '').trim();
    const finalTier = (tier || 'General Sponsorship').trim();
    const finalMsg = (message || '').trim();

    if (!finalName || !finalOrg || !finalEmail) {
      return sendError(res, 400, 'Please provide your full name, company/organisation, and email address.');
    }

    if (isObsoleteCategory(finalTier)) {
      return sendError(res, 400, 'The selected sponsorship category is no longer supported.');
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(finalEmail)) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }

    const newRequest = await SponsorRequest.create({
      userId: req.user ? req.user._id : null,
      companyName: finalOrg,
      contactPerson: finalName,
      email: finalEmail,
      phone: finalPhone || 'Not provided',
      sponsorshipType: finalTier,
      message: finalMsg,
      status: 'Pending',
    });

    return sendSuccess(res, 201, "Thank you for your enquiry! Our sponsorship team will review your proposal and get back to you shortly.", {
      id: newRequest._id,
      createdAt: newRequest.createdAt,
    });
  } catch (err) {
    console.error('submitPublicSponsorEnquiry Error:', err);
    return sendError(res, 500, 'Failed to submit sponsorship enquiry: ' + err.message);
  }
};

/**
 * GET /api/v1/sponsors/brochure
 * GET /api/v1/brochure/download
 * Publicly delivers or streams the sponsorship brochure PDF.
 * Eliminates Cloudinary HTTP 401 Unauthorized errors by securely proxying the PDF
 * through the server using authenticated Cloudinary requests or local disk fallback.
 */
const downloadBrochure = async (req, res) => {
  try {
    const isDownload = req.query.download === 'true';
    const dispositionType = isDownload ? 'attachment' : 'inline';
    const fallbackPath = path.join(__dirname, '..', 'public', 'assets', 'docs', 'ashwa-riders-sponsorship-brochure.pdf');

    // Helper to stream fallback file from disk
    const streamFallback = () => {
      if (fs.existsSync(fallbackPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispositionType}; filename="Ashwa_Riders_Sponsorship_Brochure.pdf"`);
        return fs.createReadStream(fallbackPath).pipe(res);
      }
      return sendError(res, 404, 'Sponsorship brochure PDF document is not currently available.');
    };

    // 1. Check SponsorPageContent document in MongoDB
    const doc = await SponsorPageContent.findOne({});
    let targetUrl = (doc?.hero?.buttonBrochureUrl || doc?.enquirySection?.brochureUrl || '').trim();

    // 2. If no target URL, try finding the latest PDF MediaAsset
    let publicId = '';
    let assetFilename = 'Ashwa_Riders_Sponsorship_Brochure.pdf';

    if (!targetUrl) {
      const latestPdf = await MediaAsset.findOne({
        $or: [{ mimeType: /pdf/i }, { resourceType: 'raw' }, { originalName: /pdf/i }, { url: /pdf/i }],
      }).sort({ createdAt: -1 });

      if (latestPdf) {
        targetUrl = latestPdf.url || latestPdf.secureUrl;
        publicId = latestPdf.publicId;
        assetFilename = latestPdf.originalName || latestPdf.filename || assetFilename;
      }
    }

    if (!targetUrl) {
      return streamFallback();
    }

    // 3. Handle Cloudinary document delivery
    if (targetUrl.includes('cloudinary.com') || targetUrl.includes('/raw/upload/') || publicId) {
      if (!publicId) {
        const mediaMatch = await MediaAsset.findOne({
          $or: [{ url: targetUrl }, { secureUrl: targetUrl }],
        });
        if (mediaMatch) {
          publicId = mediaMatch.publicId;
          assetFilename = mediaMatch.originalName || mediaMatch.filename || assetFilename;
        } else {
          // Extract publicId from Cloudinary URL pattern: .../upload/(v\d+/)?(path/to/file.ext)
          const match = targetUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\?.*)?$/);
          if (match && match[1]) {
            publicId = decodeURIComponent(match[1]);
          }
        }
      }

      if (publicId) {
        try {
          const downloadUrl = getCloudinaryDocumentDownloadUrl(publicId, 'pdf');
          const clientReq = https.get(downloadUrl, (cRes) => {
            if (cRes.statusCode >= 400) {
              console.warn(`[BROCHURE] Cloudinary stream returned ${cRes.statusCode}, using fallback.`);
              return streamFallback();
            }

            res.writeHead(cRes.statusCode, {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `${dispositionType}; filename="${encodeURIComponent(assetFilename)}"`,
              'Content-Length': cRes.headers['content-length'],
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=86400',
            });
            cRes.pipe(res);
          });

          clientReq.on('error', (streamErr) => {
            console.warn(`[BROCHURE] Cloudinary connection error: ${streamErr.message}, using fallback.`);
            return streamFallback();
          });
          return;
        } catch (cErr) {
          console.warn(`[BROCHURE] Cloudinary signing error: ${cErr.message}, using fallback.`);
          return streamFallback();
        }
      }
    }

    // 4. Handle local filesystem path
    if (targetUrl.startsWith('/') || !targetUrl.startsWith('http')) {
      const cleanPath = targetUrl.replace(/^\//, '');
      const localFilePath = path.join(__dirname, '..', 'public', cleanPath);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispositionType}; filename="${encodeURIComponent(assetFilename)}"`);
        return fs.createReadStream(localFilePath).pipe(res);
      }
      return streamFallback();
    }

    // 5. External URL fallback (redirect)
    return res.redirect(302, targetUrl);
  } catch (error) {
    console.error('[BROCHURE] Error serving brochure:', error);
    const fallbackPath = path.join(__dirname, '..', 'public', 'assets', 'docs', 'ashwa-riders-sponsorship-brochure.pdf');
    if (fs.existsSync(fallbackPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Ashwa_Riders_Sponsorship_Brochure.pdf"');
      return fs.createReadStream(fallbackPath).pipe(res);
    }
    return sendError(res, 500, 'Failed to serve brochure: ' + error.message);
  }
};

module.exports = {
  getOrSeedSponsorDoc,
  getPublicSponsorContent,
  getAdminSponsorContent,
  updateSponsorDraft,
  publishSponsor,
  submitPublicSponsorEnquiry,
  downloadBrochure,
};
