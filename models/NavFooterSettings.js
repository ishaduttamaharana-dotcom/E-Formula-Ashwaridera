const mongoose = require('mongoose');

const navigationItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    label: { type: String, required: true },
    url: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const socialLinkItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    platform: { type: String, default: 'instagram' },
    label: { type: String, default: '' },
    url: { type: String, default: '#' },
    icon: { type: String, default: '' },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const footerGroupLinkSchema = new mongoose.Schema(
  {
    id: { type: String },
    label: { type: String, required: true },
    url: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const footerLinkGroupSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    links: [footerGroupLinkSchema],
  },
  { _id: false }
);

const navFooterSettingsSchema = new mongoose.Schema(
  {
    // Branding & Header
    branding: {
      brandTitle: { type: String, default: 'Ashwa Riders' },
      logoUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png' },
      subtitle: { type: String, default: 'E-FORMULA · SVPCET' },
      homeUrl: { type: String, default: 'index.html' },
    },
    navigation: [navigationItemSchema],
    headerCta: {
      label: { type: String, default: 'Join Team' },
      url: { type: String, default: 'index.html#recruitment' },
      visible: { type: Boolean, default: true },
    },

    // Footer Configuration
    footerBrand: {
      brandTitle: { type: String, default: 'Ashwa Riders' },
      description: { type: String, default: 'Building Central India’s first Formula Student Electric race car. Driven by excellence, fueled by passion.' },
      logoUrl: { type: String, default: '' },
      logoLink: { type: String, default: 'index.html' },
    },
    socialLinks: [socialLinkItemSchema],
    linkGroups: [footerLinkGroupSchema],

    copyright: {
      text: { type: String, default: '© 2026 Ashwa Riders. All rights reserved.' },
      autoYear: { type: Boolean, default: true },
    },
    credit: {
      text: { type: String, default: 'Built by the Ashwa Riders Team' },
      url: { type: String, default: '' },
      visible: { type: Boolean, default: true },
    },

    appearance: {
      footerEnabled: { type: Boolean, default: true },
      socialLinksEnabled: { type: Boolean, default: true },
      footerCreditEnabled: { type: Boolean, default: true },
      headerCtaEnabled: { type: Boolean, default: true },
    },

    // Legacy Support & Flat Convenience Aliases
    brandTitle: { type: String, default: 'Ashwa Riders' },
    logoUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png' },
    ctaLabel: { type: String, default: 'Join Team' },
    ctaUrl: { type: String, default: 'index.html#recruitment' },
    footerSummary: { type: String, default: '' },
    copyrightText: { type: String, default: '© 2026 Ashwa Riders. All rights reserved.' },
    designedBy: { type: String, default: 'Built by the Ashwa Riders Team' },

    logo: {
      brandText: { type: String, default: 'Ashwa Riders' },
      markImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png' },
      subtitle: { type: String, default: 'E-FORMULA · SVPCET' },
    },
    navLinks: [
      {
        label: { type: String },
        url: { type: String },
        isCta: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
    ],
    footer: {
      slogan: { type: String, default: '' },
      copyrightText: { type: String, default: '' },
      builtByText: { type: String, default: '' },
      socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // Publishing Lifecycle
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    collection: 'nav_footer_settings',
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

// Pre-save synchronization hook to maintain 100% interoperability
navFooterSettingsSchema.pre('save', function () {
  if (!this.branding) this.branding = {};
  if (!this.headerCta) this.headerCta = {};
  if (!this.footerBrand) this.footerBrand = {};
  if (!this.copyright) this.copyright = {};
  if (!this.credit) this.credit = {};
  if (!this.appearance) this.appearance = {};

  // Sync brand title
  const brand = this.brandTitle || this.branding.brandTitle || this.logo?.brandText || 'Ashwa Riders';
  this.brandTitle = brand;
  this.branding.brandTitle = brand;
  if (!this.logo) this.logo = {};
  this.logo.brandText = brand;
  if (!this.footerBrand.brandTitle) this.footerBrand.brandTitle = brand;

  // Sync logo
  const logo = this.logoUrl || this.branding.logoUrl || this.logo?.markImageUrl || '';
  this.logoUrl = logo;
  this.branding.logoUrl = logo;
  this.logo.markImageUrl = logo;

  // Sync subtitle & homeUrl
  if (this.branding.subtitle) this.logo.subtitle = this.branding.subtitle;
  if (this.logo?.subtitle && !this.branding.subtitle) this.branding.subtitle = this.logo.subtitle;

  // Sync CTA
  const ctaTxt = this.ctaLabel || this.headerCta.label || 'Join Team';
  const ctaLnk = this.ctaUrl || this.headerCta.url || 'index.html#recruitment';
  this.ctaLabel = ctaTxt;
  this.headerCta.label = ctaTxt;
  this.ctaUrl = ctaLnk;
  this.headerCta.url = ctaLnk;

  // Sync footer summary / slogan / description
  const summary = this.footerSummary || this.footerBrand.description || this.footer?.slogan || '';
  this.footerSummary = summary;
  this.footerBrand.description = summary;
  if (!this.footer) this.footer = {};
  this.footer.slogan = summary;

  // Sync copyright
  const copy = this.copyrightText || this.copyright.text || this.footer?.copyrightText || '© 2026 Ashwa Riders. All rights reserved.';
  this.copyrightText = copy;
  this.copyright.text = copy;
  this.footer.copyrightText = copy;

  // Sync credit
  const cred = this.designedBy || this.credit.text || this.footer?.builtByText || 'Built by the Ashwa Riders Team';
  this.designedBy = cred;
  this.credit.text = cred;
  this.footer.builtByText = cred;

  // Sync navigation array to legacy navLinks
  if (Array.isArray(this.navigation) && this.navigation.length > 0) {
    this.navLinks = this.navigation.map((item, idx) => ({
      label: item.label,
      url: item.url,
      isCta: false,
      order: item.order || idx + 1,
    }));
    this.navLinks.push({
      label: this.ctaLabel,
      url: this.ctaUrl,
      isCta: true,
      order: 999,
    });
  }
});

const NavFooterSettings = mongoose.model('NavFooterSettings', navFooterSettingsSchema);

module.exports = NavFooterSettings;

