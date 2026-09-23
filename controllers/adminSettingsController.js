// ============================================================
//  controllers/adminSettingsController.js
//  Admin Controller for Singleton Page & System Settings.
//  Handles About, Car, Contact Info, Navigation/Footer & Site SEO.
// ============================================================

const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity, buildSnapshot } = require('../utils/publishingHelper');

const AboutContent = require('../models/AboutContent');
const CarSpec = require('../models/CarSpec');
const ContactInfo = require('../models/ContactInfo');
const NavFooterSettings = require('../models/NavFooterSettings');
const SiteSeoSettings = require('../models/SiteSeoSettings');

/**
 * Generic Singleton Reader helper.
 */
const getSingletonDoc = async (Model, defaultData = {}) => {
  let doc = await Model.findOne();
  if (!doc) {
    doc = new Model(defaultData);
    await doc.save();
  }
  return doc;
};

// ─── 1. ABOUT PAGE SETTINGS ─────────────────────────────────
const {
  getAdminAboutContent: getAdminAbout,
  updateAboutDraft,
  publishAbout,
} = require('./aboutPageController');
// ─── 2. CAR & SPECIFICATIONS SETTINGS ───────────────────────
const getAdminCar = async (req, res) => {
  try {
    const doc = await getSingletonDoc(CarSpec);
    return sendSuccess(res, 200, 'Car specifications retrieved.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Car specifications: ' + err.message);
  }
};

const updateCarDraft = async (req, res) => {
  try {
    const doc = await getSingletonDoc(CarSpec);
    Object.assign(doc, req.body);
    doc.draftVersion = buildSnapshot(doc.toObject());
    doc.status = 'draft';
    doc.version += 1;
    doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'UPDATE_DRAFT', resource: 'CarSpec', summary: 'Saved Car specifications draft', req });

    return sendSuccess(res, 200, 'Car specifications draft updated.', doc);
  } catch (err) {
    return sendError(res, 400, 'Error updating Car specifications draft: ' + err.message);
  }
};

const publishCar = async (req, res) => {
  try {
    const doc = await getSingletonDoc(CarSpec);
    doc.publishedVersion = doc.draftVersion || buildSnapshot(doc.toObject());
    doc.status = 'published';
    doc.version += 1;
    doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'PUBLISH', resource: 'CarSpec', summary: 'Published Car specifications', req });

    return sendSuccess(res, 200, 'Car specifications published successfully.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error publishing Car specifications: ' + err.message);
  }
};

// ─── 3. CONTACT PAGE SETTINGS ───────────────────────────────
const getAdminContact = async (req, res) => {
  try {
    const doc = await getSingletonDoc(ContactInfo);
    return sendSuccess(res, 200, 'Contact page settings retrieved.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Contact page settings: ' + err.message);
  }
};

const updateContactDraft = async (req, res) => {
  try {
    const doc = await getSingletonDoc(ContactInfo);
    Object.assign(doc, req.body);
    doc.draftVersion = buildSnapshot(doc.toObject());
    doc.status = 'draft';
    doc.version += 1;
    doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'UPDATE_DRAFT', resource: 'ContactPage', summary: 'Saved Contact page draft', req });

    return sendSuccess(res, 200, 'Contact page draft updated.', doc);
  } catch (err) {
    return sendError(res, 400, 'Error updating Contact page draft: ' + err.message);
  }
};

const publishContact = async (req, res) => {
  try {
    const doc = await getSingletonDoc(ContactInfo);
    doc.publishedVersion = doc.draftVersion || buildSnapshot(doc.toObject());
    doc.status = 'published';
    doc.version += 1;
    doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'PUBLISH', resource: 'ContactPage', summary: 'Published Contact page settings', req });

    return sendSuccess(res, 200, 'Contact page settings published.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error publishing Contact page settings: ' + err.message);
  }
};

// ─── 4. NAVIGATION & FOOTER SETTINGS ─────────────────────────
const DEFAULT_NAVIGATION = [
  { id: 'nav-1', label: 'Home', url: 'index.html', visible: true, order: 1 },
  { id: 'nav-2', label: 'About', url: 'about.html', visible: true, order: 2 },
  { id: 'nav-3', label: 'Team', url: 'team.html', visible: true, order: 3 },
  { id: 'nav-4', label: 'Car', url: 'car.html', visible: true, order: 4 },
  { id: 'nav-5', label: 'Gallery', url: 'gallery.html', visible: true, order: 5 },
  { id: 'nav-6', label: 'Sponsors', url: 'sponsors.html', visible: true, order: 6 },
  { id: 'nav-7', label: 'Achievements', url: 'achievements.html', visible: true, order: 7 },
  { id: 'nav-8', label: 'Contact', url: 'contact.html', visible: true, order: 8 },
];

const DEFAULT_SOCIAL_LINKS = [
  { id: 'soc-1', platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/eformula_ashwariders/', icon: 'fab fa-instagram', visible: true, order: 1 },
  { id: 'soc-2', platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/e-formula-ashwa-riders', icon: 'fab fa-linkedin-in', visible: true, order: 2 },
  { id: 'soc-3', platform: 'youtube', label: 'YouTube', url: '#', icon: 'fab fa-youtube', visible: true, order: 3 },
  { id: 'soc-4', platform: 'twitter', label: 'X (Twitter)', url: '#', icon: 'fab fa-x-twitter', visible: true, order: 4 },
  { id: 'soc-5', platform: 'github', label: 'GitHub', url: '#', icon: 'fab fa-github', visible: true, order: 5 },
];

const DEFAULT_LINK_GROUPS = [
  {
    id: 'grp-1',
    title: 'TEAM',
    visible: true,
    order: 1,
    links: [
      { id: 'grp-1-lnk-1', label: 'Members', url: 'team.html', visible: true, order: 1 },
      { id: 'grp-1-lnk-2', label: 'Join Us', url: 'index.html#recruitment', visible: true, order: 2 },
      { id: 'grp-1-lnk-3', label: 'Our Car', url: 'car.html', visible: true, order: 3 },
      { id: 'grp-1-lnk-4', label: 'Achievements', url: 'achievements.html', visible: true, order: 4 },
    ],
  },
  {
    id: 'grp-2',
    title: 'RESOURCES',
    visible: true,
    order: 2,
    links: [
      { id: 'grp-2-lnk-1', label: 'Blog', url: 'blog.html', visible: true, order: 1 },
      { id: 'grp-2-lnk-2', label: 'Press Kit', url: '#', visible: true, order: 2 },
      { id: 'grp-2-lnk-3', label: 'Brochure', url: '/assets/docs/ashwa-riders-sponsorship-brochure.pdf', visible: true, order: 3 },
      { id: 'grp-2-lnk-4', label: 'Donate', url: '#', visible: true, order: 4 },
    ],
  },
  {
    id: 'grp-3',
    title: 'CONTACT',
    visible: true,
    order: 3,
    links: [
      { id: 'grp-3-lnk-1', label: 'Get in Touch', url: 'contact.html', visible: true, order: 1 },
      { id: 'grp-3-lnk-2', label: 'Sponsor Us', url: 'sponsors.html', visible: true, order: 2 },
      { id: 'grp-3-lnk-3', label: 'Merchandise', url: '#', visible: true, order: 3 },
      { id: 'grp-3-lnk-4', label: 'Newsletter', url: '#', visible: true, order: 4 },
    ],
  },
];

const ensureNavDefaults = (doc) => {
  let modified = false;
  if (!doc.branding) {
    doc.branding = {
      brandTitle: doc.brandTitle || 'Ashwa Riders',
      logoUrl: doc.logoUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png',
      subtitle: doc.logo?.subtitle || 'E-FORMULA · SVPCET',
      homeUrl: 'index.html',
    };
    modified = true;
  }
  if (!doc.headerCta) {
    doc.headerCta = {
      label: doc.ctaLabel || 'Join Team',
      url: doc.ctaUrl || 'index.html#recruitment',
      visible: true,
    };
    modified = true;
  }
  if (!doc.footerBrand) {
    doc.footerBrand = {
      brandTitle: doc.brandTitle || 'Ashwa Riders',
      description: doc.footerSummary || doc.footer?.slogan || 'Building Central India’s first Formula Student Electric race car. Driven by excellence, fueled by passion.',
      logoUrl: '',
      logoLink: 'index.html',
    };
    modified = true;
  }
  if (!doc.copyright) {
    doc.copyright = {
      text: doc.copyrightText || doc.footer?.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
      autoYear: true,
    };
    modified = true;
  }
  if (!doc.credit) {
    doc.credit = {
      text: doc.designedBy || doc.footer?.builtByText || 'Built by the Ashwa Riders Team',
      url: '',
      visible: true,
    };
    modified = true;
  }
  if (!doc.appearance) {
    doc.appearance = {
      footerEnabled: true,
      socialLinksEnabled: true,
      footerCreditEnabled: true,
      headerCtaEnabled: true,
    };
    modified = true;
  }
  if (!Array.isArray(doc.navigation) || doc.navigation.length === 0) {
    doc.navigation = DEFAULT_NAVIGATION;
    modified = true;
  }
  if (!Array.isArray(doc.socialLinks) || doc.socialLinks.length === 0) {
    doc.socialLinks = DEFAULT_SOCIAL_LINKS;
    modified = true;
  }
  if (!Array.isArray(doc.linkGroups) || doc.linkGroups.length === 0) {
    doc.linkGroups = DEFAULT_LINK_GROUPS;
    modified = true;
  }
  return modified;
};

const getAdminNavFooter = async (req, res) => {
  try {
    const doc = await getSingletonDoc(NavFooterSettings);
    const needSave = ensureNavDefaults(doc);
    if (needSave) {
      await doc.save();
    }

    const obj = doc.toObject ? doc.toObject() : doc;
    const draft = obj.draftVersion || obj;

    const responseData = {
      ...obj,
      branding: draft.branding || obj.branding,
      navigation: draft.navigation && draft.navigation.length ? draft.navigation : obj.navigation,
      headerCta: draft.headerCta || obj.headerCta,
      footerBrand: draft.footerBrand || obj.footerBrand,
      socialLinks: draft.socialLinks && draft.socialLinks.length ? draft.socialLinks : obj.socialLinks,
      linkGroups: draft.linkGroups && draft.linkGroups.length ? draft.linkGroups : obj.linkGroups,
      copyright: draft.copyright || obj.copyright,
      credit: draft.credit || obj.credit,
      appearance: draft.appearance || obj.appearance,

      brandTitle: draft.branding?.brandTitle || draft.brandTitle || 'Ashwa Riders',
      logoUrl: draft.branding?.logoUrl || draft.logoUrl || '',
      ctaLabel: draft.headerCta?.label || draft.ctaLabel || 'Join Team',
      ctaUrl: draft.headerCta?.url || draft.ctaUrl || 'index.html#recruitment',
      footerSummary: draft.footerBrand?.description || draft.footerSummary || '',
      copyrightText: draft.copyright?.text || draft.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
      designedBy: draft.credit?.text || draft.designedBy || 'Built by the Ashwa Riders Team',
    };

    return sendSuccess(res, 200, 'Navigation & Footer settings retrieved.', responseData);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving Navigation & Footer settings: ' + err.message);
  }
};

const updateNavFooterDraft = async (req, res) => {
  try {
    const doc = await getSingletonDoc(NavFooterSettings);
    ensureNavDefaults(doc);
    const body = req.body || {};

    // 1. Branding
    if (body.branding) {
      doc.branding = { ...doc.branding?.toObject?.() || doc.branding, ...body.branding };
      if (body.branding.brandTitle) doc.brandTitle = body.branding.brandTitle;
      if (body.branding.logoUrl) doc.logoUrl = body.branding.logoUrl;
    } else if (body.brandTitle || body.logoUrl) {
      if (!doc.branding) doc.branding = {};
      if (body.brandTitle) { doc.branding.brandTitle = body.brandTitle; doc.brandTitle = body.brandTitle; }
      if (body.logoUrl) { doc.branding.logoUrl = body.logoUrl; doc.logoUrl = body.logoUrl; }
    }

    // 2. Navigation Items
    if (Array.isArray(body.navigation)) {
      doc.navigation = body.navigation.map((item, idx) => ({
        id: item.id || `nav-${Date.now()}-${idx}`,
        label: item.label || 'Link',
        url: item.url || '#',
        visible: item.visible !== false,
        order: Number(item.order) || idx + 1,
      }));
    }

    // 3. Header CTA
    if (body.headerCta) {
      doc.headerCta = { ...doc.headerCta?.toObject?.() || doc.headerCta, ...body.headerCta };
      if (body.headerCta.label) doc.ctaLabel = body.headerCta.label;
      if (body.headerCta.url) doc.ctaUrl = body.headerCta.url;
    } else if (body.ctaLabel || body.ctaUrl) {
      if (!doc.headerCta) doc.headerCta = {};
      if (body.ctaLabel) { doc.headerCta.label = body.ctaLabel; doc.ctaLabel = body.ctaLabel; }
      if (body.ctaUrl) { doc.headerCta.url = body.ctaUrl; doc.ctaUrl = body.ctaUrl; }
    }

    // 4. Footer Brand
    if (body.footerBrand) {
      doc.footerBrand = { ...doc.footerBrand?.toObject?.() || doc.footerBrand, ...body.footerBrand };
      if (body.footerBrand.description) doc.footerSummary = body.footerBrand.description;
    } else if (body.footerSummary) {
      if (!doc.footerBrand) doc.footerBrand = {};
      doc.footerBrand.description = body.footerSummary;
      doc.footerSummary = body.footerSummary;
    }

    // 5. Social Links
    if (Array.isArray(body.socialLinks)) {
      doc.socialLinks = body.socialLinks.map((item, idx) => ({
        id: item.id || `soc-${Date.now()}-${idx}`,
        platform: item.platform || 'instagram',
        label: item.label || item.platform || '',
        url: item.url || '#',
        icon: item.icon || '',
        visible: item.visible !== false,
        order: Number(item.order) || idx + 1,
      }));
    }

    // 6. Footer Link Groups
    if (Array.isArray(body.linkGroups)) {
      doc.linkGroups = body.linkGroups.map((grp, gIdx) => ({
        id: grp.id || `grp-${Date.now()}-${gIdx}`,
        title: grp.title || 'GROUP',
        visible: grp.visible !== false,
        order: Number(grp.order) || gIdx + 1,
        links: Array.isArray(grp.links)
          ? grp.links.map((lnk, lIdx) => ({
              id: lnk.id || `lnk-${Date.now()}-${lIdx}`,
              label: lnk.label || 'Link',
              url: lnk.url || '#',
              visible: lnk.visible !== false,
              order: Number(lnk.order) || lIdx + 1,
            }))
          : [],
      }));
    }

    // 7. Copyright
    if (body.copyright) {
      doc.copyright = { ...doc.copyright?.toObject?.() || doc.copyright, ...body.copyright };
      if (body.copyright.text) doc.copyrightText = body.copyright.text;
    } else if (body.copyrightText) {
      if (!doc.copyright) doc.copyright = {};
      doc.copyright.text = body.copyrightText;
      doc.copyrightText = body.copyrightText;
    }

    // 8. Footer Credit
    if (body.credit) {
      doc.credit = { ...doc.credit?.toObject?.() || doc.credit, ...body.credit };
      if (body.credit.text) doc.designedBy = body.credit.text;
    } else if (body.designedBy) {
      if (!doc.credit) doc.credit = {};
      doc.credit.text = body.designedBy;
      doc.designedBy = body.designedBy;
    }

    // 9. Appearance Options
    if (body.appearance) {
      doc.appearance = { ...doc.appearance?.toObject?.() || doc.appearance, ...body.appearance };
    }

    // Build draft snapshot without publishing
    const snapshot = buildSnapshot(doc.toObject());
    doc.draftVersion = snapshot;
    doc.status = 'draft';
    doc.version = (doc.version || 0) + 1;
    if (req.user && req.user._id) doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'UPDATE_DRAFT', resource: 'NavFooterSettings', summary: 'Updated Navigation & Footer draft', req });

    return sendSuccess(res, 200, 'Navigation & Footer draft updated.', doc);
  } catch (err) {
    return sendError(res, 400, 'Error updating Navigation & Footer draft: ' + err.message);
  }
};

const publishNavFooter = async (req, res) => {
  try {
    const doc = await getSingletonDoc(NavFooterSettings);
    ensureNavDefaults(doc);

    // Apply draftVersion to the root document if present
    if (doc.draftVersion) {
      const draft = doc.draftVersion;
      if (draft.branding) doc.branding = draft.branding;
      if (draft.navigation) doc.navigation = draft.navigation;
      if (draft.headerCta) doc.headerCta = draft.headerCta;
      if (draft.footerBrand) doc.footerBrand = draft.footerBrand;
      if (draft.socialLinks) doc.socialLinks = draft.socialLinks;
      if (draft.linkGroups) doc.linkGroups = draft.linkGroups;
      if (draft.copyright) doc.copyright = draft.copyright;
      if (draft.credit) doc.credit = draft.credit;
      if (draft.appearance) doc.appearance = draft.appearance;

      if (draft.brandTitle !== undefined) doc.brandTitle = draft.brandTitle;
      if (draft.logoUrl !== undefined) doc.logoUrl = draft.logoUrl;
      if (draft.ctaLabel !== undefined) doc.ctaLabel = draft.ctaLabel;
      if (draft.ctaUrl !== undefined) doc.ctaUrl = draft.ctaUrl;
      if (draft.footerSummary !== undefined) doc.footerSummary = draft.footerSummary;
      if (draft.copyrightText !== undefined) doc.copyrightText = draft.copyrightText;
      if (draft.designedBy !== undefined) doc.designedBy = draft.designedBy;
    }

    const snapshot = buildSnapshot(doc.toObject());
    snapshot.publishedAt = new Date();
    doc.publishedVersion = snapshot;
    doc.status = 'published';
    doc.version = (doc.version || 0) + 1;
    if (req.user && req.user._id) doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'PUBLISH', resource: 'NavFooterSettings', summary: 'Published Navigation & Footer settings', req });

    return sendSuccess(res, 200, 'Navigation & Footer settings published.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error publishing Navigation & Footer settings: ' + err.message);
  }
};

// ─── 5. SITE SEO SETTINGS ───────────────────────────────────
const getAdminSeo = async (req, res) => {
  try {
    const doc = await getSingletonDoc(SiteSeoSettings);
    return sendSuccess(res, 200, 'Site SEO settings retrieved.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving SEO settings: ' + err.message);
  }
};

const updateSeoDraft = async (req, res) => {
  try {
    const doc = await getSingletonDoc(SiteSeoSettings);
    Object.assign(doc, req.body);
    doc.draftVersion = buildSnapshot(doc.toObject());
    doc.status = 'draft';
    doc.version += 1;
    doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'UPDATE_DRAFT', resource: 'SiteSeoSettings', summary: 'Updated SEO settings draft', req });

    return sendSuccess(res, 200, 'SEO settings draft updated.', doc);
  } catch (err) {
    return sendError(res, 400, 'Error updating SEO draft: ' + err.message);
  }
};

const publishSeo = async (req, res) => {
  try {
    const doc = await getSingletonDoc(SiteSeoSettings);
    doc.publishedVersion = doc.draftVersion || buildSnapshot(doc.toObject());
    doc.status = 'published';
    doc.version += 1;
    doc.updatedBy = req.user._id;

    await doc.save();
    await logActivity({ user: req.user, action: 'PUBLISH', resource: 'SiteSeoSettings', summary: 'Published SEO settings', req });

    return sendSuccess(res, 200, 'SEO settings published successfully.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error publishing SEO settings: ' + err.message);
  }
};

module.exports = {
  getAdminAbout,
  updateAboutDraft,
  publishAbout,
  getAdminCar,
  updateCarDraft,
  publishCar,
  getAdminContact,
  updateContactDraft,
  publishContact,
  getAdminNavFooter,
  updateNavFooterDraft,
  publishNavFooter,
  getAdminSeo,
  updateSeoDraft,
  publishSeo,
};
