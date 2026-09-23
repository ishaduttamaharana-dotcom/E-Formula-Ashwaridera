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

const SponsorPageContent = require('../models/SponsorPageContent');
const SponsorRequest = require('../models/SponsorRequest');
const NavFooterSettings = require('../models/NavFooterSettings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const DEFAULT_SPONSORS = [
  { id: 'sp-1', name: 'E-Formula Ashwa Riders', tier: 'Title', logoUrl: '', altText: 'E-Formula Ashwa Riders', websiteUrl: '', icon: 'fas fa-bolt', order: 1, visible: true },
  { id: 'sp-2', name: 'MORP', tier: 'Gold', logoUrl: '', altText: 'MORP', websiteUrl: '', icon: 'fas fa-cog', order: 2, visible: true },
  { id: 'sp-3', name: 'MATLAB', tier: 'Gold', logoUrl: '', altText: 'MATLAB', websiteUrl: '', icon: 'fas fa-chart-simple', order: 3, visible: true },
  { id: 'sp-4', name: 'Carbonext', tier: 'Silver', logoUrl: '', altText: 'Carbonext', websiteUrl: '', icon: 'fas fa-leaf', order: 4, visible: true },
  { id: 'sp-5', name: 'EIPRISM', tier: 'Silver', logoUrl: '', altText: 'EIPRISM', websiteUrl: '', icon: 'fas fa-cube', order: 5, visible: true },
  { id: 'sp-6', name: 'CIRCUITRONICS LLP', tier: 'Technical Partner', logoUrl: '', altText: 'CIRCUITRONICS LLP', websiteUrl: '', icon: 'fas fa-microchip', order: 6, visible: true },
  { id: 'sp-7', name: 'Maharashtra Bear & Belting Co.', tier: 'Technical Partner', logoUrl: '', altText: 'Maharashtra Bear & Belting Co.', websiteUrl: '', icon: 'fas fa-industry', order: 7, visible: true },
  { id: 'sp-8', name: 'ALTAIR', tier: 'Technical Partner', logoUrl: '', altText: 'ALTAIR', websiteUrl: '', icon: 'fas fa-chart-line', order: 8, visible: true },
  { id: 'sp-9', name: 'ANSYS', tier: 'Technical Partner', logoUrl: '', altText: 'ANSYS', websiteUrl: '', icon: 'fas fa-cubes', order: 9, visible: true },
  { id: 'sp-10', name: 'BENDER', tier: 'Technical Partner', logoUrl: '', altText: 'BENDER', websiteUrl: '', icon: 'fas fa-shield', order: 10, visible: true },
  { id: 'sp-11', name: 'Vashi INTEGRATE SOLUTIONS', tier: 'Associate', logoUrl: '', altText: 'Vashi INTEGRATE SOLUTIONS', websiteUrl: '', icon: 'fas fa-wave-square', order: 11, visible: true },
  { id: 'sp-12', name: 'PERFECTIO', tier: 'Associate', logoUrl: '', altText: 'PERFECTIO', websiteUrl: '', icon: 'fas fa-star', order: 12, visible: true },
  { id: 'sp-13', name: 'ADAPT.IMPROVISE.OVERCOME', tier: 'Associate', logoUrl: '', altText: 'ADAPT.IMPROVISE.OVERCOME', websiteUrl: '', icon: 'fas fa-arrows-rotate', order: 13, visible: true },
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
    title: 'Technical Partner',
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

/**
 * Retrieve or initialize the singleton SponsorPageContent document.
 */
const getOrSeedSponsorDoc = async () => {
  let doc = await SponsorPageContent.findOne();
  if (doc) return doc;

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
    const rawRailItems = source.rail?.items || DEFAULT_SPONSORS;
    const railItems = rawRailItems
      .filter((item) => isPreview || item.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter tiers by visibility and sort by order
    const rawTiers = source.tiersSection?.tiers || DEFAULT_TIERS;
    const tiers = rawTiers
      .filter((tier) => isPreview || tier.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const responseData = {
      settings: source.settings || {},
      rail: {
        ...(source.rail || {}),
        items: railItems,
      },
      hero: source.hero || {},
      tiersSection: {
        ...(source.tiersSection || {}),
        tiers,
      },
      enquirySection: source.enquirySection || {},
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

    // Build clean draft object (only metadata and string URLs)
    const newDraft = {
      settings: payload.settings || doc.draftVersion?.settings || doc.settings,
      rail: payload.rail || doc.draftVersion?.rail || doc.rail,
      hero: payload.hero || doc.draftVersion?.hero || doc.hero,
      tiersSection: payload.tiersSection || doc.draftVersion?.tiersSection || doc.tiersSection,
      enquirySection: payload.enquirySection || doc.draftVersion?.enquirySection || doc.enquirySection,
    };

    doc.draftVersion = newDraft;
    doc.status = 'draft';
    doc.lastEditedAt = new Date();

    await doc.save();

    return sendSuccess(res, 200, 'Sponsor Page draft saved successfully.', {
      status: doc.status,
      version: doc.version,
      lastEditedAt: doc.lastEditedAt,
      draftVersion: doc.draftVersion,
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

module.exports = {
  getOrSeedSponsorDoc,
  getPublicSponsorContent,
  getAdminSponsorContent,
  updateSponsorDraft,
  publishSponsor,
  submitPublicSponsorEnquiry,
};
