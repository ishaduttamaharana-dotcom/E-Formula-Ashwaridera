// ============================================================
//  controllers/contactPageController.js
//  Unified Controller for Contact Page Control Center.
//  Controls:
//    01. HEADER / HERO (Hero content, background image, overlay,
//        and telemetry statistics)
//    02. OPEN CHANNELS (Contact channels, status, actionable links,
//        and transmission form configuration)
//    03. FIND US (Map configuration, coordinates, and workshop info)
//    04. FOOTER (Shared reference)
//  Draft / Preview / Publish lifecycle with lightweight JSON only.
// ============================================================

const ContactPageContent = require('../models/ContactPageContent');
const ContactInfo = require('../models/ContactInfo');
const NavFooterSettings = require('../models/NavFooterSettings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const DEFAULT_STATS = [
  { id: 'stat-1', value: '< 24H', label: 'AVG. REPLY TIME', order: 1, enabled: true },
  { id: 'stat-2', value: '04', label: 'OPEN CHANNELS', order: 2, enabled: true },
  { id: 'stat-3', value: 'Nagpur', label: 'HOME WORKSHOP', order: 3, enabled: true },
  { id: 'stat-4', value: 'Mon–Sat', label: 'ON DUTY', order: 4, enabled: true },
];

const DEFAULT_CHANNELS = [
  {
    id: 'ch-1',
    channelNumber: '01',
    type: 'EMAIL',
    name: 'contact@ashwariders.com',
    secondaryValue: '',
    description: 'Best for sponsorship, press, and detailed queries',
    status: 'MONITORED',
    icon: 'fas fa-envelope',
    actionUrl: 'mailto:contact@ashwariders.com',
    order: 1,
    published: true,
  },
  {
    id: 'ch-2',
    channelNumber: '02',
    type: 'VOICE',
    name: '+91 90961 10224',
    secondaryValue: '+91 93259 66459',
    description: 'Mon–Sat, 9:00 AM – 7:00 PM IST',
    status: 'ON DUTY',
    icon: 'fas fa-phone',
    actionUrl: 'tel:+919096110224',
    order: 2,
    published: true,
  },
  {
    id: 'ch-3',
    channelNumber: '03',
    type: 'RADIO',
    name: 'WhatsApp — +91 90961 10224',
    secondaryValue: '',
    description: 'Fastest for quick questions',
    status: 'LIVE',
    icon: 'fab fa-whatsapp',
    actionUrl: 'https://wa.me/919096110224',
    order: 3,
    published: true,
  },
  {
    id: 'ch-4',
    channelNumber: '04',
    type: 'PIT',
    name: 'Ashwa Riders Garage, SVPCET Campus, Wardha Road, Nagpur 441108',
    secondaryValue: '',
    description: 'Visits welcome by appointment',
    status: 'BY APPT.',
    icon: 'fas fa-map-marker-alt',
    actionUrl: '#pitlane',
    order: 4,
    published: true,
  },
];

const DEFAULT_CHANNEL_OPTIONS = [
  { id: 'opt-1', label: 'General Inquiry', value: 'general', enabled: true, order: 1 },
  { id: 'opt-2', label: 'Sponsorship / Partnership', value: 'sponsorship', enabled: true, order: 2 },
  { id: 'opt-3', label: 'Recruitment / Join Team', value: 'recruitment', enabled: true, order: 3 },
  { id: 'opt-4', label: 'Media / Press', value: 'media', enabled: true, order: 4 },
  { id: 'opt-5', label: 'Event Collaboration', value: 'event', enabled: true, order: 5 },
  { id: 'opt-6', label: 'Other', value: 'other', enabled: true, order: 6 },
];

/**
 * Helper to build default channels from authoritative ContactInfo
 */
const buildChannelsFromContactInfo = (contactInfoDoc) => {
  const email = contactInfoDoc?.email || 'contact@ashwariders.com';
  const phone = contactInfoDoc?.phone || '+91 90961 10224';
  const altPhone = contactInfoDoc?.alternatePhone || '+91 93259 66459';
  const wa = contactInfoDoc?.whatsapp || '9096110224';
  const addr = contactInfoDoc?.address || 'Ashwa Riders Garage, SVPCET Campus, Wardha Road, Nagpur 441108';

  return [
    {
      id: 'ch-email',
      channelNumber: '01',
      type: 'EMAIL',
      name: email,
      secondaryValue: '',
      description: 'Best for sponsorship, press, and detailed queries',
      status: 'MONITORED',
      icon: 'fas fa-envelope',
      actionUrl: `mailto:${email}`,
      order: 1,
      published: true,
    },
    {
      id: 'ch-voice',
      channelNumber: '02',
      type: 'VOICE',
      name: phone,
      secondaryValue: altPhone,
      description: contactInfoDoc?.officeHours || 'Mon–Sat, 9:00 AM – 7:00 PM IST',
      status: 'ON DUTY',
      icon: 'fas fa-phone',
      actionUrl: `tel:${phone.replace(/\s+/g, '')}`,
      order: 2,
      published: true,
    },
    {
      id: 'ch-wa',
      channelNumber: '03',
      type: 'RADIO',
      name: `WhatsApp — ${wa.replace(/^(\+?91)?/, '+91 ')}`.trim(),
      secondaryValue: '',
      description: 'Fastest for quick questions',
      status: 'LIVE',
      icon: 'fab fa-whatsapp',
      actionUrl: `https://wa.me/${wa.replace(/\D/g, '')}`,
      order: 3,
      published: true,
    },
    {
      id: 'ch-pit',
      channelNumber: '04',
      type: 'PIT',
      name: addr,
      secondaryValue: '',
      description: 'Visits welcome by appointment',
      status: 'BY APPT.',
      icon: 'fas fa-map-marker-alt',
      actionUrl: '#pitlane',
      order: 4,
      published: true,
    },
  ];
};

/**
 * Retrieve or initialize the singleton ContactPageContent document.
 */
const getOrSeedContactDoc = async () => {
  let doc = await ContactPageContent.findOne();
  const contactInfoDoc = await ContactInfo.findOne().lean().catch(() => null);

  if (doc) {
    const channels = doc.channelsSection?.channels || [];
    const publishedChannels = doc.publishedVersion?.channelsSection?.channels || [];
    const draftChannels = doc.draftVersion?.channelsSection?.channels || [];

    const heroStats = doc.heroSection?.stats || [];
    const publishedHeroStats = doc.publishedVersion?.heroSection?.stats || [];
    const draftHeroStats = doc.draftVersion?.heroSection?.stats || [];

    let needsSave = false;

    if (channels.length === 0 || publishedChannels.length === 0 || draftChannels.length === 0) {
      const defaultChannels = buildChannelsFromContactInfo(contactInfoDoc);
      if (!doc.channelsSection) doc.channelsSection = {};
      if (channels.length === 0) doc.channelsSection.channels = defaultChannels;

      if (!doc.publishedVersion) doc.publishedVersion = doc.toObject();
      if (!doc.publishedVersion.channelsSection) doc.publishedVersion.channelsSection = {};
      if (publishedChannels.length === 0) doc.publishedVersion.channelsSection.channels = defaultChannels;

      if (!doc.draftVersion) doc.draftVersion = doc.toObject();
      if (!doc.draftVersion.channelsSection) doc.draftVersion.channelsSection = {};
      if (draftChannels.length === 0) doc.draftVersion.channelsSection.channels = defaultChannels;

      doc.markModified('channelsSection');
      needsSave = true;
      console.log('⚡ Auto-repaired ContactPageContent channels with authoritative ContactInfo channels.');
    }

    if (heroStats.length === 0 || publishedHeroStats.length === 0 || draftHeroStats.length === 0) {
      if (!doc.heroSection) doc.heroSection = {};
      if (heroStats.length === 0) doc.heroSection.stats = DEFAULT_STATS;

      if (!doc.publishedVersion) doc.publishedVersion = doc.toObject();
      if (!doc.publishedVersion.heroSection) doc.publishedVersion.heroSection = {};
      if (publishedHeroStats.length === 0) doc.publishedVersion.heroSection.stats = DEFAULT_STATS;

      if (!doc.draftVersion) doc.draftVersion = doc.toObject();
      if (!doc.draftVersion.heroSection) doc.draftVersion.heroSection = {};
      if (draftHeroStats.length === 0) doc.draftVersion.heroSection.stats = DEFAULT_STATS;

      doc.markModified('heroSection');
      needsSave = true;
      console.log('⚡ Auto-repaired ContactPageContent hero stats with DEFAULT_STATS.');
    }

    if (needsSave) {
      doc.markModified('publishedVersion');
      doc.markModified('draftVersion');
      await doc.save();
    }
    return doc;
  }

  console.log('⚡ Initializing Contact Page Control Center document with authentic defaults...');

  const initialChannels = buildChannelsFromContactInfo(contactInfoDoc);

  const initialDoc = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    settings: {
      pageTitle: 'Ashwa Riders — Contact / Race Control',
      seoTitle: 'Contact & Race Control | Ashwa Riders Formula Student Electric',
      seoDescription: 'Get in touch with Ashwa Riders Formula Student Electric team. Channels for sponsorship, recruitment, media, and workshop visits.',
      ogImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784491291/IMG_0234_1_csal4p.jpg',
      canonicalUrl: 'contact.html',
      visible: true,
    },
    heroSection: {
      visible: true,
      bgImageUrl: '',
      overlayStrength: 0.85,
      eyebrow: 'RACE CONTROL — OPEN FREQUENCY',
      heading: 'TALK TO E-FORMULA ASHWA RIDERS',
      headingHighlight: 'E-FORMULA ASHWA RIDERS',
      description: 'Sponsorship, recruitment, media, or just a question about the car — pick a channel below or send a transmission straight to the pit box.',
      stats: DEFAULT_STATS,
    },
    channelsSection: {
      visible: true,
      eyebrow: 'OPEN CHANNELS',
      heading: 'HOW TO REACH US',
      headingHighlight: 'CONNECT',
      description: 'Select the best channel below to contact the team directly for sponsorship inquiries, student recruitment, or technical discussions.',
      sideNote: 'Message us through any channel — everything routes to the same pit box.',
      channels: initialChannels,
      formSettings: {
        eyebrow: 'TRANSMIT MESSAGE',
        frequencyLabel: 'FREQ 88.6 MHz',
        title: 'Transmit Message',
        nameLabel: 'CALLSIGN (NAME)',
        namePlaceholder: 'Your full name',
        emailLabel: 'RETURN FREQUENCY (EMAIL)',
        emailPlaceholder: 'you@example.com',
        channelLabel: 'CHANNEL',
        channelPlaceholder: 'Select a subject...',
        channelOptions: DEFAULT_CHANNEL_OPTIONS,
        messageLabel: 'MESSAGE',
        messagePlaceholder: 'Tell us how we can help...',
        submitButtonText: 'Transmit Message',
        footnote: 'All transmissions received within 24 hours, Mon–Sat',
        successMessage: 'Message received — pit box will reply within 24 hours.',
        errorMessage: 'Transmission failed. Please verify your details or use direct frequency.',
      },
    },
    findUsSection: {
      visible: true,
      eyebrow: 'FIND US',
      heading: 'THE PIT LANE',
      headingHighlight: 'PIT LANE',
      description: 'Our workshop at St. Vincent Pallotti College of Engineering & Technology, Nagpur, where our electric Formula car gets built, tested, and race-prepped.',
      map: {
        provider: 'google_embed',
        embedUrl: contactInfoDoc?.googleMapUrl || 'https://www.google.com/maps?q=St.+Vincent+Pallotti+College+of+Engineering+and+Technology,+Gavsi+Manapur,+Wardha+Road,+Nagpur,+Maharashtra+441108&output=embed',
        latitude: '21.0047',
        longitude: '79.0476',
        zoom: 15,
        locationName: 'E-FORMULA ASHWA RIDERS WORKSHOP',
      },
      workshop: {
        name: 'E-FORMULA ASHWA RIDERS WORKSHOP',
        address: contactInfoDoc?.address || 'Ashwa Riders Garage, SVPCET Campus, Wardha Road, Nagpur 441108',
        coordinates: '21.0047°N / 79.0476°E',
        access: 'By Appointment',
        hours: contactInfoDoc?.officeHours || 'Mon–Sat, 9:00 AM – 7:00 PM IST',
        visitorInstructions: 'Coming to visit? Reach out on Channel 01 or 03 first so the team can walk you through the garage.',
      },
    },
  };

  initialDoc.draftVersion = JSON.parse(JSON.stringify(initialDoc));
  initialDoc.publishedVersion = JSON.parse(JSON.stringify(initialDoc));

  doc = await ContactPageContent.create(initialDoc);
  console.log('✅ Contact Page Control Center document initialized successfully.');
  return doc;
};

/**
 * Public Endpoint: GET /api/v1/contact/page
 * Returns published version (or draft if ?preview=true)
 */
const getPublicContactContent = async (req, res) => {
  try {
    const doc = await getOrSeedContactDoc();
    const isPreview = req.query.preview === 'true';

    let content;
    if (isPreview && doc.draftVersion) {
      content = doc.draftVersion;
    } else if (doc.publishedVersion) {
      content = doc.publishedVersion;
    } else {
      content = doc.toObject();
    }

    // Filter visible items
    const visibleStats = (content.heroSection?.stats || [])
      .filter((s) => isPreview || s.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    let visibleChannels = (content.channelsSection?.channels || [])
      .filter((ch) => isPreview || ch.published !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const visibleChannelOptions = (content.channelsSection?.formSettings?.channelOptions || content.channelsSection?.formSettings?.subjectOptions || [])
      .filter((opt) => isPreview || opt.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Fetch authoritative ContactInfo singleton to bridge socialLinks and contact details
    const contactInfoDoc = await ContactInfo.findOne().lean().catch(() => null);

    // If visibleChannels is empty or missing EMAIL/VOICE channels, synthesize from authoritative ContactInfo
    const emailChannel = visibleChannels.find((ch) => ch.type === 'EMAIL');
    const voiceChannel = visibleChannels.find((ch) => ch.type === 'VOICE');

    const authoritativeEmail = contactInfoDoc?.email || (emailChannel ? emailChannel.name : '');
    const authoritativePhone = contactInfoDoc?.phone || (voiceChannel ? voiceChannel.name : '');
    const authoritativeAltPhone = contactInfoDoc?.alternatePhone || (voiceChannel ? voiceChannel.secondaryValue : '');

    // Ensure email channel exists and has authoritative email
    if (!emailChannel && authoritativeEmail) {
      visibleChannels.unshift({
        id: 'ch-email',
        channelNumber: '01',
        type: 'EMAIL',
        name: authoritativeEmail,
        secondaryValue: '',
        description: 'Best for sponsorship, press, and detailed queries',
        status: 'MONITORED',
        icon: 'fas fa-envelope',
        actionUrl: `mailto:${authoritativeEmail}`,
        order: 1,
        published: true,
      });
    } else if (emailChannel && authoritativeEmail && (!emailChannel.name || emailChannel.name.includes('example.com'))) {
      emailChannel.name = authoritativeEmail;
      emailChannel.actionUrl = `mailto:${authoritativeEmail}`;
    }

    // Ensure voice channel exists and has authoritative phone
    if (!voiceChannel && authoritativePhone) {
      const emailIdx = visibleChannels.findIndex((ch) => ch.type === 'EMAIL');
      const voiceObj = {
        id: 'ch-voice',
        channelNumber: '02',
        type: 'VOICE',
        name: authoritativePhone,
        secondaryValue: authoritativeAltPhone || '',
        description: contactInfoDoc?.officeHours || 'Mon–Sat, 9:00 AM – 7:00 PM IST',
        status: 'ON DUTY',
        icon: 'fas fa-phone',
        actionUrl: `tel:${authoritativePhone.replace(/\s+/g, '')}`,
        order: 2,
        published: true,
      };
      if (emailIdx >= 0) {
        visibleChannels.splice(emailIdx + 1, 0, voiceObj);
      } else {
        visibleChannels.push(voiceObj);
      }
    } else if (voiceChannel && authoritativePhone && (!voiceChannel.name || voiceChannel.name.includes('00000'))) {
      voiceChannel.name = authoritativePhone;
      voiceChannel.actionUrl = `tel:${authoritativePhone.replace(/\s+/g, '')}`;
      if (authoritativeAltPhone && !voiceChannel.secondaryValue) {
        voiceChannel.secondaryValue = authoritativeAltPhone;
      }
    }

    const formatWaUrl = (wa) => {
      if (!wa || wa === '#') return '';
      if (wa.startsWith('http://') || wa.startsWith('https://')) return wa;
      return `https://wa.me/${wa.replace(/\D/g, '')}`;
    };

    const cleanSocialUrl = (url) => {
      if (!url || url === '#') return '';
      return url.trim();
    };

    const socialLinks = {
      instagram: cleanSocialUrl(contactInfoDoc?.instagram || content.socialLinks?.instagram || content.channelsSection?.socialLinks?.instagram),
      linkedin: cleanSocialUrl(contactInfoDoc?.linkedin || content.socialLinks?.linkedin || content.channelsSection?.socialLinks?.linkedin),
      youtube: cleanSocialUrl(contactInfoDoc?.youtube || content.socialLinks?.youtube || content.channelsSection?.socialLinks?.youtube),
      twitter: cleanSocialUrl(contactInfoDoc?.twitter || content.socialLinks?.twitter || content.channelsSection?.socialLinks?.twitter),
      whatsapp: formatWaUrl(contactInfoDoc?.whatsapp || content.socialLinks?.whatsapp || content.channelsSection?.socialLinks?.whatsapp),
      facebook: cleanSocialUrl(contactInfoDoc?.facebook || content.socialLinks?.facebook || content.channelsSection?.socialLinks?.facebook),
      website: cleanSocialUrl(contactInfoDoc?.website || content.socialLinks?.website || content.channelsSection?.socialLinks?.website),
      github: cleanSocialUrl(contactInfoDoc?.github || content.socialLinks?.github || content.channelsSection?.socialLinks?.github),
    };

    const heroTitle = content.heroSection?.heading || content.heroSection?.title || 'TALK TO E-FORMULA ASHWA RIDERS';
    const heroHighlight = content.heroSection?.headingHighlight || content.heroSection?.titleHighlight || 'E-FORMULA ASHWA RIDERS';
    const heroBg = content.heroSection?.bgImageUrl || content.heroSection?.backgroundImage || '';
    const heroOverlay = content.heroSection?.overlayStrength !== undefined ? content.heroSection?.overlayStrength : (content.heroSection?.overlayIntensity !== undefined ? content.heroSection?.overlayIntensity : 0.85);

    const channelsTitle = content.channelsSection?.heading || content.channelsSection?.title || 'HOW TO REACH US';
    const channelsHighlight = content.channelsSection?.headingHighlight || content.channelsSection?.titleHighlight || 'CONNECT';

    const findUsTitle = content.findUsSection?.heading || content.findUsSection?.title || 'THE PIT LANE';
    const findUsHighlight = content.findUsSection?.headingHighlight || content.findUsSection?.titleHighlight || 'PIT LANE';

    return sendSuccess(res, 200, 'Contact page content retrieved.', {
      isPreview,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      settings: content.settings,
      email: authoritativeEmail,
      phone: authoritativePhone,
      alternatePhone: authoritativeAltPhone,
      address: contactInfoDoc?.address || content.findUsSection?.workshop?.address || '',
      officeHours: contactInfoDoc?.officeHours || content.findUsSection?.workshop?.hours || '',
      socialLinks,
      heroSection: {
        ...content.heroSection,
        title: heroTitle,
        heading: heroTitle,
        titleHighlight: heroHighlight,
        headingHighlight: heroHighlight,
        backgroundImage: heroBg,
        bgImageUrl: heroBg,
        overlayIntensity: heroOverlay,
        overlayStrength: heroOverlay,
        stats: visibleStats,
      },
      channelsSection: {
        ...content.channelsSection,
        title: channelsTitle,
        heading: channelsTitle,
        titleHighlight: channelsHighlight,
        headingHighlight: channelsHighlight,
        channels: visibleChannels,
        socialLinks,
        formSettings: {
          ...content.channelsSection?.formSettings,
          title: content.channelsSection?.formSettings?.title || content.channelsSection?.formSettings?.formTitle || 'Transmit Message',
          formTitle: content.channelsSection?.formSettings?.formTitle || content.channelsSection?.formSettings?.title || 'Transmit Message',
          channelOptions: visibleChannelOptions,
          subjectOptions: visibleChannelOptions,
        },
      },
      findUsSection: {
        ...content.findUsSection,
        title: findUsTitle,
        heading: findUsTitle,
        titleHighlight: findUsHighlight,
        headingHighlight: findUsHighlight,
      },
    });
  } catch (err) {
    console.error('Error in getPublicContactContent:', err);
    return sendError(res, 500, 'Error retrieving Contact content: ' + err.message);
  }
};

/**
 * Admin Endpoint: GET /api/v1/admin/contact/page (and /admin/contact-page)
 * Returns current draft content for the CMS Control Center
 */
const getAdminContactContent = async (req, res) => {
  try {
    const doc = await getOrSeedContactDoc();

    const data = doc.draftVersion || doc.toObject();
    const publishedData = doc.publishedVersion || doc.toObject();

    // Fetch authoritative ContactInfo and shared footer reference
    const contactInfoDoc = await ContactInfo.findOne().lean().catch(() => null);
    const footerRef = await NavFooterSettings.findOne().lean().catch(() => null);

    const socialLinks = {
      instagram: contactInfoDoc?.instagram || data.socialLinks?.instagram || '',
      linkedin: contactInfoDoc?.linkedin || data.socialLinks?.linkedin || '',
      youtube: contactInfoDoc?.youtube || data.socialLinks?.youtube || '',
      twitter: contactInfoDoc?.twitter || data.socialLinks?.twitter || '',
      whatsapp: contactInfoDoc?.whatsapp || data.socialLinks?.whatsapp || '',
      github: contactInfoDoc?.github || data.socialLinks?.github || '',
      facebook: contactInfoDoc?.facebook || data.socialLinks?.facebook || '',
      website: contactInfoDoc?.website || data.socialLinks?.website || '',
    };

    return sendSuccess(res, 200, 'Contact CMS data retrieved.', {
      page: doc,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      lastEditedAt: doc.lastEditedAt,
      settings: data.settings,
      heroSection: data.heroSection,
      channelsSection: data.channelsSection,
      findUsSection: data.findUsSection,
      socialLinks,
      contactInfo: contactInfoDoc,
      footerSummary: footerRef ? {
        lastPublishedAt: footerRef.lastPublishedAt,
        status: footerRef.status,
      } : null,
    });
  } catch (err) {
    console.error('Error in getAdminContactContent:', err);
    return sendError(res, 500, 'Error loading Contact CMS: ' + err.message);
  }
};

/**
 * Admin Endpoint: PATCH / PUT /api/v1/admin/contact/page (and /admin/contact-page)
 * Saves updates to draftVersion without publishing live
 */
const updateContactDraft = async (req, res) => {
  try {
    const doc = await getOrSeedContactDoc();
    const payload = req.body || {};

    // Validate payload size safety
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > 500000) {
      return sendError(res, 400, 'Payload size exceeds safe limit. Please ensure images are uploaded via MediaPicker.');
    }

    const currentDraft = doc.draftVersion || doc.toObject();

    const updatedDraft = {
      ...currentDraft,
      settings: payload.settings !== undefined ? payload.settings : currentDraft.settings,
      heroSection: payload.heroSection !== undefined ? payload.heroSection : currentDraft.heroSection,
      channelsSection: payload.channelsSection !== undefined ? payload.channelsSection : currentDraft.channelsSection,
      findUsSection: payload.findUsSection !== undefined ? payload.findUsSection : currentDraft.findUsSection,
      socialLinks: payload.socialLinks !== undefined ? payload.socialLinks : (currentDraft.socialLinks || {}),
    };

    doc.draftVersion = updatedDraft;
    doc.status = 'draft';
    doc.lastEditedAt = new Date();

    await doc.save();

    return sendSuccess(res, 200, 'Contact draft saved successfully.', {
      status: doc.status,
      version: doc.version,
      lastEditedAt: doc.lastEditedAt,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    console.error('Error in updateContactDraft:', err);
    return sendError(res, 500, 'Error saving Contact draft: ' + err.message);
  }
};

/**
 * Admin Endpoint: POST /api/v1/admin/contact/page/publish (and /admin/contact-page/publish)
 * Promotes sanitized draftVersion to publishedVersion and syncs ContactInfo
 */
const publishContact = async (req, res) => {
  try {
    const doc = await getOrSeedContactDoc();

    const draft = doc.draftVersion || doc.toObject();

    doc.publishedVersion = JSON.parse(JSON.stringify(draft));
    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    // Also update root fields for consistency
    if (draft.settings) doc.settings = draft.settings;
    if (draft.heroSection) doc.heroSection = draft.heroSection;
    if (draft.channelsSection) doc.channelsSection = draft.channelsSection;
    if (draft.findUsSection) doc.findUsSection = draft.findUsSection;
    if (draft.socialLinks) doc.socialLinks = draft.socialLinks;

    await doc.save();

    // Sync core contact fields to ContactInfo for 100% backward compatibility
    try {
      const emailChannel = (draft.channelsSection?.channels || []).find(c => c.type === 'EMAIL');
      const voiceChannel = (draft.channelsSection?.channels || []).find(c => c.type === 'VOICE');
      const waChannel = (draft.channelsSection?.channels || []).find(c => c.type === 'WHATSAPP' || c.type === 'RADIO');

      const contactInfoUpdates = {};
      if (emailChannel?.name) contactInfoUpdates.email = emailChannel.name;
      if (voiceChannel?.name) contactInfoUpdates.phone = voiceChannel.name;
      if (voiceChannel?.secondaryValue) contactInfoUpdates.alternatePhone = voiceChannel.secondaryValue;
      if (waChannel?.name) {
        contactInfoUpdates.whatsapp = waChannel.name.replace(/WhatsApp\s*—\s*/i, '').trim();
      }
      if (draft.findUsSection?.workshop?.address) {
        contactInfoUpdates.address = draft.findUsSection.workshop.address;
      }
      if (draft.findUsSection?.map?.embedUrl) {
        contactInfoUpdates.googleMapUrl = draft.findUsSection.map.embedUrl;
      }
      if (draft.findUsSection?.workshop?.hours) {
        contactInfoUpdates.officeHours = draft.findUsSection.workshop.hours;
      }
      if (draft.socialLinks) {
        if (draft.socialLinks.instagram !== undefined) contactInfoUpdates.instagram = draft.socialLinks.instagram;
        if (draft.socialLinks.linkedin !== undefined) contactInfoUpdates.linkedin = draft.socialLinks.linkedin;
        if (draft.socialLinks.youtube !== undefined) contactInfoUpdates.youtube = draft.socialLinks.youtube;
        if (draft.socialLinks.twitter !== undefined) contactInfoUpdates.twitter = draft.socialLinks.twitter;
        if (draft.socialLinks.github !== undefined) contactInfoUpdates.github = draft.socialLinks.github;
        if (draft.socialLinks.whatsapp !== undefined) contactInfoUpdates.whatsapp = draft.socialLinks.whatsapp;
      }

      await ContactInfo.findOneAndUpdate({}, contactInfoUpdates, { upsert: true, new: true });
      console.log('✅ Synchronized ContactInfo singleton with published ContactPageContent.');
    } catch (syncErr) {
      console.warn('Notice: Non-critical ContactInfo sync warning:', syncErr.message);
    }

    if (req.user) {
      await logActivity(
        req.user._id,
        'PUBLISH_CONTACT_PAGE',
        'ContactPageContent',
        doc._id,
        `Contact Page v${doc.version} published live by ${req.user.fullName || req.user.email}`
      ).catch(() => {});
    }

    return sendSuccess(res, 200, 'Contact page published live successfully!', {
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    console.error('Error in publishContact:', err);
    return sendError(res, 500, 'Error publishing Contact page: ' + err.message);
  }
};

module.exports = {
  getOrSeedContactDoc,
  getPublicContactContent,
  getAdminContactContent,
  updateContactDraft,
  publishContact,
};
