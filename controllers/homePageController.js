// ============================================================
//  controllers/homePageController.js
//  Home Page Control Center Unified Controller
//  Manages all 4 Homepage blocks (Hero, Car+Story, News, Footer+Sponsors),
//  Auto-migration from existing records, Draft / Preview / Publish lifecycle.
// ============================================================

const HomePageContent = require('../models/HomePageContent');
const HeroSlide = require('../models/HeroSlide');
const BuildStage = require('../models/BuildStage');
const GarageCard = require('../models/GarageCard');
const NewsArticle = require('../models/NewsArticle');
const HomeStat = require('../models/HomeStat');
const NavFooterSettings = require('../models/NavFooterSettings');
const Sponsor = require('../models/Sponsor');

const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity, buildSnapshot } = require('../utils/publishingHelper');

// Default Marquee Sponsor Tiers for Home page
const DEFAULT_SPONSOR_TIERS = [
  {
    id: 'tier-gold',
    name: 'Gold Tier',
    slug: 'gold-tier',
    direction: 'forward',
    visible: true,
    animationEnabled: true,
    animationSpeed: 'normal',
    order: 0,
    sponsors: [
      { id: 'sp-1', name: 'TechCorp', logoUrl: '', icon: 'fas fa-crown', websiteUrl: 'sponsors.html', altText: 'TechCorp', tier: 'Gold Tier', description: '', visible: true, featured: true, order: 0 },
      { id: 'sp-2', name: 'EnergySys', logoUrl: '', icon: 'fas fa-bolt', websiteUrl: 'sponsors.html', altText: 'EnergySys', tier: 'Gold Tier', description: '', visible: true, featured: false, order: 1 },
      { id: 'sp-3', name: 'VoltAge', logoUrl: '', icon: 'fas fa-car-battery', websiteUrl: 'sponsors.html', altText: 'VoltAge', tier: 'Gold Tier', description: '', visible: true, featured: false, order: 2 },
    ],
  },
  {
    id: 'tier-silver',
    name: 'Silver Tier',
    slug: 'silver-tier',
    direction: 'reverse',
    visible: true,
    animationEnabled: true,
    animationSpeed: 'normal',
    order: 1,
    sponsors: [
      { id: 'sp-4', name: 'Carbonext', logoUrl: '', icon: 'fas fa-leaf', websiteUrl: 'sponsors.html', altText: 'Carbonext', tier: 'Silver Tier', description: '', visible: true, featured: false, order: 0 },
      { id: 'sp-5', name: 'AeroDyn', logoUrl: '', icon: 'fas fa-wind', websiteUrl: 'sponsors.html', altText: 'AeroDyn', tier: 'Silver Tier', description: '', visible: true, featured: false, order: 1 },
      { id: 'sp-6', name: 'NeuralWorks', logoUrl: '', icon: 'fas fa-brain', websiteUrl: 'sponsors.html', altText: 'NeuralWorks', tier: 'Silver Tier', description: '', visible: true, featured: false, order: 2 },
      { id: 'sp-7', name: 'DataLink', logoUrl: '', icon: 'fas fa-satellite-dish', websiteUrl: 'sponsors.html', altText: 'DataLink', tier: 'Silver Tier', description: '', visible: true, featured: false, order: 3 },
    ],
  },
  {
    id: 'tier-bronze',
    name: 'Bronze Tier',
    slug: 'bronze-tier',
    direction: 'forward',
    visible: true,
    animationEnabled: true,
    animationSpeed: 'normal',
    order: 2,
    sponsors: [
      { id: 'sp-8', name: 'MotoParts', logoUrl: '', icon: 'fas fa-industry', websiteUrl: 'sponsors.html', altText: 'MotoParts', tier: 'Bronze Tier', description: '', visible: true, featured: false, order: 0 },
      { id: 'sp-9', name: 'EcoDrive', logoUrl: '', icon: 'fas fa-leaf', websiteUrl: 'sponsors.html', altText: 'EcoDrive', tier: 'Bronze Tier', description: '', visible: true, featured: false, order: 1 },
      { id: 'sp-10', name: 'GripWorks', logoUrl: '', icon: 'fas fa-tools', websiteUrl: 'sponsors.html', altText: 'GripWorks', tier: 'Bronze Tier', description: '', visible: true, featured: false, order: 2 },
    ],
  },
  {
    id: 'tier-technical',
    name: 'Technical Partners',
    slug: 'technical-partners',
    direction: 'reverse',
    visible: true,
    animationEnabled: true,
    animationSpeed: 'normal',
    order: 3,
    sponsors: [
      { id: 'sp-11', name: 'Bosch', logoUrl: '', icon: 'fas fa-cogs', websiteUrl: 'sponsors.html', altText: 'Bosch', tier: 'Technical Partners', description: '', visible: true, featured: false, order: 0 },
      { id: 'sp-12', name: 'Zuken', logoUrl: '', icon: 'fas fa-microchip', websiteUrl: 'sponsors.html', altText: 'Zuken', tier: 'Technical Partners', description: '', visible: true, featured: false, order: 1 },
    ],
  },
  {
    id: 'tier-education',
    name: 'Education Partners',
    slug: 'education-partners',
    direction: 'forward',
    visible: true,
    animationEnabled: true,
    animationSpeed: 'normal',
    order: 4,
    sponsors: [
      { id: 'sp-13', name: 'IIT Bombay', logoUrl: '', icon: 'fas fa-university', websiteUrl: 'sponsors.html', altText: 'IIT Bombay', tier: 'Education Partners', description: '', visible: true, featured: false, order: 0 },
      { id: 'sp-14', name: 'BMS College', logoUrl: '', icon: 'fas fa-school', websiteUrl: 'sponsors.html', altText: 'BMS College', tier: 'Education Partners', description: '', visible: true, featured: false, order: 1 },
    ],
  },
  {
    id: 'tier-media',
    name: 'Media Partners',
    slug: 'media-partners',
    direction: 'reverse',
    visible: true,
    animationEnabled: true,
    animationSpeed: 'normal',
    order: 5,
    sponsors: [
      { id: 'sp-15', name: 'EV Reporter', logoUrl: '', icon: 'fas fa-newspaper', websiteUrl: 'sponsors.html', altText: 'EV Reporter', tier: 'Media Partners', description: '', visible: true, featured: false, order: 0 },
      { id: 'sp-16', name: 'Sportskeeda', logoUrl: '', icon: 'fas fa-video', websiteUrl: 'sponsors.html', altText: 'Sportskeeda', tier: 'Media Partners', description: '', visible: true, featured: false, order: 1 },
    ],
  },
];

/**
 * Initialize default or migrated Home Document if not present.
 */
const getOrSeedHomeDoc = async () => {
  let doc = await HomePageContent.findOne();
  if (doc) {
    let needsSave = false;
    if (!doc.footerSponsors) {
      doc.footerSponsors = {};
      needsSave = true;
    }
    if (!doc.footerSponsors.sponsorSection) {
      doc.footerSponsors.sponsorSection = {};
      needsSave = true;
    }
    if (!Array.isArray(doc.footerSponsors.sponsorSection.tiers) || doc.footerSponsors.sponsorSection.tiers.length === 0) {
      doc.footerSponsors.sponsorSection.tiers = DEFAULT_SPONSOR_TIERS;
      needsSave = true;
    }
    if (needsSave) {
      doc.markModified('footerSponsors');
      const snapshot = buildSnapshot(doc.toObject());
      doc.publishedVersion = snapshot;
      doc.draftVersion = snapshot;
      doc.markModified('publishedVersion');
      doc.markModified('draftVersion');
      await doc.save();
    }
    return doc;
  }

  console.log('⚡ Initializing Home Page Control Center document from existing records...');

  // 1. Gather existing Hero Slides
  const existingSlides = await HeroSlide.find({ status: { $ne: 'archived' } }).sort({ order: 1 });
  const heroSlides = existingSlides.map((s, idx) => ({
    id: String(s._id),
    badgeText: s.badgeText || 'Ashwa Riders — 2026 Season',
    heading: s.heading || 'ASHWA RIDERS',
    highlightText: 'RIDERS',
    subtitle: s.subtitle || 'Engineering Speed. Building Innovation. Racing the Future.',
    description: s.description || '',
    mediaType: s.mediaType || 'video',
    imageUrl: s.imageUrl || '',
    videoUrl: s.videoUrl || 'https://res.cloudinary.com/frjck4sc/video/upload/v1784445874/vidssave.com_This_is_FORMULA_1_1080P_ex9dby.mp4',
    posterUrl: '',
    mobileImageUrl: s.mobileImageUrl || '',
    primaryBtnText: s.primaryBtnText || 'Explore Our Car',
    primaryBtnLink: s.primaryBtnLink || 'car.html',
    primaryBtnVisible: true,
    secondaryBtnText: s.secondaryBtnText || 'Become a Sponsor',
    secondaryBtnLink: s.secondaryBtnLink || 'sponsors.html',
    secondaryBtnVisible: true,
    overlayOpacity: s.overlayOpacity !== undefined ? s.overlayOpacity : 40,
    textAlignment: s.textAlignment || 'center',
    status: s.status === 'published' ? 'published' : 'draft',
    order: s.order || idx,
  }));

  // Fallback default slide if none existed
  if (heroSlides.length === 0) {
    heroSlides.push({
      id: 'slide-default-1',
      badgeText: 'Ashwa Riders — 2026 Season',
      heading: 'ASHWA RIDERS',
      highlightText: 'RIDERS',
      subtitle: 'Engineering Speed. Building Innovation. Racing the Future.',
      description: '',
      mediaType: 'video',
      imageUrl: '',
      videoUrl: 'https://res.cloudinary.com/frjck4sc/video/upload/v1784445874/vidssave.com_This_is_FORMULA_1_1080P_ex9dby.mp4',
      posterUrl: '',
      mobileImageUrl: '',
      primaryBtnText: 'Explore Our Car',
      primaryBtnLink: 'car.html',
      primaryBtnVisible: true,
      secondaryBtnText: 'Become a Sponsor',
      secondaryBtnLink: 'sponsors.html',
      secondaryBtnVisible: true,
      overlayOpacity: 40,
      textAlignment: 'center',
      status: 'published',
      order: 0,
    });
  }

  // 2. Gather existing Stats
  const existingStats = await HomeStat.find({ status: { $ne: 'archived' } }).sort({ order: 1 });
  let heroStats = existingStats.map((st, idx) => ({
    label: st.label,
    value: st.value,
    order: st.order || idx,
  }));

  if (heroStats.length === 0) {
    heroStats = [
      { label: 'Team Members', value: '25', order: 0 },
      { label: 'Departments', value: '4', order: 1 },
      { label: 'Eng. Hours', value: '5000', order: 2 },
      { label: 'FB Car', value: '1', order: 3 },
      { label: 'Sponsors', value: '20', order: 4 },
      { label: 'Awards', value: '8', order: 5 },
    ];
  }

  // 3. Default Car Story Cards (Garage to Grid 3D Card Burst)
  const carCards = [
    {
      id: 'card-stage-0a',
      position: 'tl',
      stageIndex: 0,
      stepNumber: '01',
      eyebrow: 'Concept & Targets',
      title: 'The Idea Takes Shape.',
      highlightWord: 'Idea',
      description: 'Season begins with a blank whiteboard — lap-time targets, weight budget, and powertrain philosophy set before a single weld is struck.',
      accentColor: '#ff5a00',
      stats: [
        { value: '120', unit: 'KG', label: 'Target Weight' },
        { value: 'EV', unit: '', label: 'Powertrain' },
        { value: '4.2', unit: 'S', label: '0–100 km/h' },
      ],
      ctaText: '',
      ctaUrl: '',
      imageUrl: '',
      icon: 'fas fa-lightbulb',
      visible: true,
      order: 0,
    },
    {
      id: 'card-stage-0b',
      position: 'br',
      stageIndex: 0,
      stepNumber: 'AIR 8',
      eyebrow: 'Formula Bharat 2026',
      title: 'Our Mission.',
      highlightWord: 'Mission',
      description: 'Every engineering decision traces back to one goal — a top finish at the national stage of Formula Bharat.',
      accentColor: '#ff5a00',
      stats: [
        { value: '5k+', unit: '', label: 'Eng. Hours' },
        { value: '100', unit: '%', label: 'Student Built' },
      ],
      ctaText: '',
      ctaUrl: '',
      imageUrl: '',
      icon: 'fas fa-flag-checkered',
      visible: true,
      order: 1,
    },
    {
      id: 'card-stage-1a',
      position: 'tr',
      stageIndex: 1,
      stepNumber: '02',
      eyebrow: 'CAD & Simulation',
      title: 'CAD. FEA. CFD. Repeat.',
      highlightWord: 'FEA',
      description: 'Chassis, powertrain, and aero designed in CAD, stress-tested with FEA, and flow-optimised with CFD — before a single part is cut.',
      accentColor: '#00af50',
      stats: [
        { value: '3,200+', unit: '', label: 'Components' },
        { value: '1st', unit: '', label: "Altair Sim '25" },
      ],
      ctaText: '',
      ctaUrl: '',
      imageUrl: '',
      icon: 'fas fa-laptop-code',
      visible: true,
      order: 2,
    },
    {
      id: 'card-stage-1b',
      position: 'bl',
      stageIndex: 1,
      stepNumber: 'Struct.',
      eyebrow: 'Spaceframe',
      title: 'Triangulated Steel.',
      highlightWord: 'Steel',
      description: 'High-tensile spaceframe built for maximum torsional rigidity and FIA driver cell compliance. 45,000 NM/° stiffness — 28 KG frame mass.',
      accentColor: '#00af50',
      stats: [
        { value: '45k', unit: 'NM/°', label: 'Stiffness' },
        { value: '28', unit: 'KG', label: 'Frame Mass' },
      ],
      ctaText: '',
      ctaUrl: '',
      imageUrl: '',
      icon: 'fas fa-shapes',
      visible: true,
      order: 3,
    },
    {
      id: 'card-stage-2a',
      position: 'tl',
      stageIndex: 2,
      stepNumber: '03',
      eyebrow: 'Fabrication',
      title: 'Metal Meets Blueprint.',
      highlightWord: 'Blueprint',
      description: 'Tubes are cut, bent, and TIG-welded to CAD tolerance. Carbon composite panels are hand-laid and vacuum-bagged. Every part is measured twice.',
      accentColor: '#00c0f0',
      stats: [
        { value: '0.5', unit: 'MM', label: 'Jig Tolerance' },
        { value: 'TIG', unit: '', label: '4130 Welds' },
      ],
      ctaText: '',
      ctaUrl: '',
      imageUrl: '',
      icon: 'fas fa-fire',
      visible: true,
      order: 4,
    },
  ];

  // 4. Gather existing News Articles
  const existingArticles = await NewsArticle.find({ status: { $ne: 'archived' } }).sort({ order: 1, createdAt: -1 });
  let newsArticles = existingArticles.map((a, idx) => ({
    id: String(a._id),
    title: a.title,
    slug: a.slug || `article-${idx + 1}`,
    date: a.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'FEB 2026'),
    category: a.category || 'News',
    tag: a.tag || 'AIR 8',
    icon: a.icon || 'fas fa-newspaper',
    description: a.description || '',
    content: a.content || '',
    imageUrl: a.imageUrl || '',
    ctaText: 'Read More',
    ctaUrl: 'blog.html',
    status: a.status === 'published' ? 'published' : 'draft',
    order: a.order || idx,
  }));

  if (newsArticles.length === 0) {
    newsArticles = [
      {
        id: 'news-1',
        title: 'Formula Bharat 2026: Overall AIR 8',
        slug: 'formula-bharat-2026-air-8',
        date: 'FEB 2026',
        category: 'Competition',
        tag: 'AIR 8',
        icon: 'fas fa-trophy',
        description: 'Highest overall standing: AIR 8. Sub-category: AIR 10 Business Plan, AIR 12 Engineering Design, AIR 14 Cost & Manufacturing.',
        content: '',
        imageUrl: '',
        ctaText: 'Read More',
        ctaUrl: 'blog.html',
        status: 'published',
        order: 0,
      },
      {
        id: 'news-2',
        title: 'Altair Simulation Challenge 2025',
        slug: 'altair-simulation-challenge-2025',
        date: 'DEC 2025',
        category: 'Award',
        tag: 'Winner',
        icon: 'fas fa-microchip',
        description: 'Official winning team with cash prizes for outstanding engineering design optimization using Altair Inspire software.',
        content: '',
        imageUrl: '',
        ctaText: 'Read More',
        ctaUrl: 'blog.html',
        status: 'published',
        order: 1,
      },
      {
        id: 'news-3',
        title: 'Formula Bharat 2024: Tarkshya Debut',
        slug: 'formula-bharat-2024-tarkshya',
        date: 'FEB 2024',
        category: 'Milestone',
        tag: 'AIR 19',
        icon: 'fas fa-flag-checkered',
        description: 'Second legacy EV vehicle (Tarkshya) debuts at AIR 19 out of 45 teams after intense safety and technical inspections.',
        content: '',
        imageUrl: '',
        ctaText: 'Read More',
        ctaUrl: 'blog.html',
        status: 'published',
        order: 2,
      },
    ];
  }

  // 5. Gather existing Nav & Footer settings
  const existingNavFooter = await NavFooterSettings.findOne();
  const footerCompany = (existingNavFooter && existingNavFooter.footer) || {};
  const socialLinks = [];

  const rawSocial = (footerCompany && footerCompany.socialLinks) || {};
  const platforms = [
    { name: 'Instagram', icon: 'fab fa-instagram', url: rawSocial.instagram || 'https://www.instagram.com/eformula_ashwariders/' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: rawSocial.linkedin || 'https://www.linkedin.com/company/e-formula-ashwa-riders' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: rawSocial.youtube || '#' },
    { name: 'X', icon: 'fab fa-x-twitter', url: rawSocial.twitter || '#' },
    { name: 'GitHub', icon: 'fab fa-github', url: rawSocial.github || '#' },
  ];
  platforms.forEach((p, idx) => {
    socialLinks.push({ platform: p.name, icon: p.icon, url: p.url, visible: true, order: idx });
  });

  // Footer Navigation columns
  const navColumns = [
    {
      id: 'col-team',
      title: 'Team',
      order: 0,
      links: [
        { label: 'Members', url: 'team.html', order: 0, visible: true },
        { label: 'Join Us', url: 'index.html#recruitment', order: 1, visible: true },
        { label: 'Our Car', url: 'car.html', order: 2, visible: true },
        { label: 'Achievements', url: 'achievements.html', order: 3, visible: true },
      ],
    },
    {
      id: 'col-resources',
      title: 'Resources',
      order: 1,
      links: [
        { label: 'Blog', url: 'blog.html', order: 0, visible: true },
        { label: 'Press Kit', url: '#', order: 1, visible: true },
        { label: 'Brochure', url: '/assets/docs/ashwa-riders-sponsorship-brochure.pdf', order: 2, visible: true },
        { label: 'Donate', url: '#', order: 3, visible: true },
      ],
    },
    {
      id: 'col-contact',
      title: 'Contact',
      order: 2,
      links: [
        { label: 'Get in Touch', url: 'contact.html', order: 0, visible: true },
        { label: 'Sponsor Us', url: 'sponsors.html', order: 1, visible: true },
        { label: 'Merchandise', url: '#', order: 2, visible: true },
        { label: 'Newsletter', url: '#', order: 3, visible: true },
      ],
    },
  ];

  // Marquee Sponsor tiers
  const sponsorTiers = DEFAULT_SPONSOR_TIERS;

  doc = new HomePageContent({
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    hero: {
      transition: {
        type: 'fade',
        duration: 700,
        autoplay: true,
        interval: 5000,
        pauseOnHover: true,
      },
      slides: heroSlides,
      stats: heroStats,
    },
    carStory: {
      sectionVisible: true,
      sectionLabel: 'Garage To Grid · 2026 Season',
      mainMedia: {
        desktopImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png',
        mobileImageUrl: '',
        videoUrl: '',
        altText: 'Ashwa Riders Formula Student Car 2026',
        position: 'center',
      },
      settings: {
        scrollEffect: 'parallax',
        cardTransition: 'fade',
        duration: 600,
        autoProgression: false,
        progressIndicators: true,
        scrollIndicator: true,
      },
      cards: carCards,
    },
    news: {
      sectionSettings: {
        visible: true,
        eyebrow: 'Latest News',
        heading: "What's Happening",
        highlightText: 'Happening',
        description: 'Stay updated with the latest from Ashwa Riders.',
        viewAllText: 'View All News',
        viewAllUrl: 'blog.html',
      },
      articles: newsArticles,
    },
    footerSponsors: {
      sponsorSection: {
        visible: true,
        eyebrow: 'Sponsors & Partners',
        heading: 'Backed By The Best',
        highlightText: 'Best',
        description: 'Every tier of support that makes the car possible.',
        viewAllUrl: 'sponsors.html',
        tiers: sponsorTiers,
      },
      sponsorCTA: {
        visible: true,
        eyebrow: 'Partner With Us',
        heading: 'Become Our Sponsor',
        highlightText: 'Sponsor',
        description: 'Put your brand on a race car engineered by 25+ student engineers competing at Formula Bharat.',
        primaryBtnText: 'Become Our Sponsor',
        primaryBtnUrl: 'sponsors.html',
        secondaryBtnText: 'Download Sponsorship Brochure',
        secondaryBtnUrl: '/assets/docs/ashwa-riders-sponsorship-brochure.pdf',
        brochureFile: '',
      },
      company: {
        brandName: (existingNavFooter && existingNavFooter.logo && existingNavFooter.logo.brandText) || 'AshwaRiders',
        description: footerCompany.slogan || "Building Central India's first Formula Student Electric race car. Driven by excellence, fueled by passion.",
        copyrightText: footerCompany.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
        builtByText: footerCompany.builtByText || 'Built by the Ashwa Riders Team',
      },
      navColumns,
      socialLinks,
    },
  });

  const snapshot = buildSnapshot(doc.toObject());
  doc.publishedVersion = snapshot;
  doc.draftVersion = snapshot;
  await doc.save();

  console.log('✅ Home Page Control Center document successfully created and seeded.');
  return doc;
};

/**
 * GET /api/v1/admin/home
 * Admin endpoint: Retrieves the unified Home document (both draft & published state).
 */
const getAdminHomeContent = async (req, res) => {
  try {
    const doc = await getOrSeedHomeDoc();
    return sendSuccess(res, 200, 'Home page control center content retrieved.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving home content: ' + err.message);
  }
};

/**
 * PATCH /api/v1/admin/home
 * Admin endpoint: Updates draft changes without immediately changing the public website.
 */
const updateHomeDraft = async (req, res) => {
  try {
    const doc = await getOrSeedHomeDoc();
    const body = req.body || {};

    if (body.hero) doc.hero = Object.assign(doc.hero || {}, body.hero);
    if (body.carStory) doc.carStory = Object.assign(doc.carStory || {}, body.carStory);
    if (body.news) doc.news = Object.assign(doc.news || {}, body.news);
    if (body.footerSponsors) {
      doc.footerSponsors = Object.assign(doc.footerSponsors || {}, body.footerSponsors);
      doc.markModified('footerSponsors');
    }

    doc.draftVersion = buildSnapshot(doc.toObject());
    doc.markModified('draftVersion');
    doc.status = 'draft';
    doc.version += 1;
    doc.lastEditedAt = new Date();
    doc.updatedBy = req.user ? req.user._id : null;

    await doc.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_DRAFT',
      resource: 'HomePage',
      summary: 'Saved Home page draft changes',
      req,
    });

    return sendSuccess(res, 200, 'Home page draft saved successfully.', doc);
  } catch (err) {
    return sendError(res, 400, 'Error updating home page draft: ' + err.message);
  }
};

/**
 * POST /api/v1/admin/home/publish
 * Admin endpoint: Promotes the current draft to published status and makes it live on the public website.
 */
const publishHome = async (req, res) => {
  try {
    const doc = await getOrSeedHomeDoc();

    const snapshot = doc.draftVersion || buildSnapshot(doc.toObject());
    doc.publishedVersion = snapshot;
    doc.markModified('publishedVersion');
    doc.status = 'published';
    doc.version += 1;
    doc.lastPublishedAt = new Date();
    doc.updatedBy = req.user ? req.user._id : null;

    await doc.save();

    await logActivity({
      user: req.user,
      action: 'PUBLISH',
      resource: 'HomePage',
      summary: `Published Home page version (v${doc.version})`,
      req,
    });

    return sendSuccess(res, 200, 'Home page published successfully. Public website updated.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error publishing home page: ' + err.message);
  }
};

/**
 * GET /api/v1/admin/home/preview
 * Admin endpoint: Fetches current draft content formatted for live preview inspection.
 */
const getHomePreview = async (req, res) => {
  try {
    const doc = await getOrSeedHomeDoc();
    const data = doc.draftVersion || doc.publishedVersion || doc.toObject();
    return sendSuccess(res, 200, 'Home page preview content retrieved.', data);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving preview content: ' + err.message);
  }
};

/**
 * GET /api/v1/home
 * Public endpoint: Returns published content for the homepage.
 * If req.query.preview === 'true' and an admin session is detected, returns draftVersion.
 */
const getPublicHome = async (req, res) => {
  try {
    const doc = await getOrSeedHomeDoc();
    const isPreview = req.query.preview === 'true';

    let data;
    if (isPreview && doc.draftVersion) {
      data = doc.draftVersion;
    } else {
      data = doc.publishedVersion || doc.toObject();
    }

    // Clean internal audit fields
    const rawSection = data.footerSponsors?.sponsorSection || {};
    const rawTiers = rawSection.tiers || [];
    let publicTiers;

    if (isPreview) {
      publicTiers = rawTiers.map((t) => ({
        ...t,
        order: t.order || 0,
        sponsors: (t.sponsors || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
    } else {
      // Level 1: Tier visibility check
      // Level 2: Individual sponsor visibility check
      // Empty tier behavior: Omit tier if 0 visible sponsors
      publicTiers = rawTiers
        .filter((t) => t.visible !== false)
        .map((t) => ({
          ...t,
          order: t.order || 0,
          sponsors: (t.sponsors || [])
            .filter((s) => s.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        }))
        .filter((t) => t.sponsors.length > 0)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    const publicFooterSponsors = {
      ...data.footerSponsors,
      sponsorSection: {
        ...rawSection,
        tiers: publicTiers,
      },
    };

    const publicPayload = {
      hero: data.hero,
      carStory: data.carStory,
      news: data.news,
      footerSponsors: publicFooterSponsors,
      version: data.version,
      lastPublishedAt: data.lastPublishedAt,
      isPreview,
      // Backward-compatible aliases for legacy readers
      heroSlides: data.hero?.slides || [],
      buildStory: data.carStory?.cards || [],
      statistics: data.carStory?.stats || [],
      sponsors: publicTiers.flatMap((t) =>
        (t.sponsors || []).map((s) => ({ ...s, tier: t.name, tierName: t.name }))
      ),
    };

    return sendSuccess(res, 200, 'Homepage content retrieved.', publicPayload);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving homepage content: ' + err.message);
  }
};

module.exports = {
  getOrSeedHomeDoc,
  getAdminHomeContent,
  updateHomeDraft,
  publishHome,
  getHomePreview,
  getPublicHome,
};
