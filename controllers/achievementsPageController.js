// ============================================================
//  controllers/achievementsPageController.js
//  Unified Controller for Achievements Page Control Center.
//  Controls:
//    01. HEADER & SETTINGS
//    02. OUR ACHIEVEMENTS (Eyebrow, title, highlight, description,
//        dynamic categories with live counts, achievements roster)
//    03. OUR JOURNEY (Timeline section, background image & overlay,
//        chronological timeline events)
//    04. FOOTER (Shared reference)
//  Draft / Preview / Publish lifecycle with lightweight JSON only.
// ============================================================

const AchievementsPageContent = require('../models/AchievementsPageContent');
const NavFooterSettings = require('../models/NavFooterSettings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const DEFAULT_CATEGORIES = [
  { id: 'cat-comp', name: 'Competitions', slug: 'competition', icon: 'fas fa-flag-checkered', order: 1, enabled: true },
  { id: 'cat-award', name: 'Awards', slug: 'award', icon: 'fas fa-star', order: 2, enabled: true },
  { id: 'cat-rec', name: 'Milestones', slug: 'record', icon: 'fas fa-flag', order: 3, enabled: true },
  { id: 'cat-cert', name: 'Recognition', slug: 'certificate', icon: 'fas fa-award', order: 4, enabled: true },
];

const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'ach-1',
    year: '2024',
    title: 'Formula Bharat — AIR 8 Overall',
    description: 'Formula Ashwariders, our combustion team, secured an overall All India Rank of 8 at Formula Bharat 2024, its best national result to date.',
    category: 'competition',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483846/SAVE_20260111_173616.jpg_1_srifam.jpg',
    imageAlt: 'Formula Ashwariders at Formula Bharat 2024',
    event: 'Formula Bharat 2024',
    rank: 'AIR 8',
    awardName: '',
    location: 'India',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Formula Bharat', 'Combustion', 'National'],
    order: 1,
    published: true,
    featured: true,
  },
  {
    id: 'ach-2',
    year: '2024',
    title: 'Formula Bharat — AIR 19 (Electric)',
    description: 'E-Formula Ashwariders finished AIR 19 overall out of 45 electric teams nationwide, clearing technical inspection with an in-house manufactured accumulator container.',
    category: 'competition',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483829/1768116510403.jpg_1_ibfo5t.jpg',
    imageAlt: 'E-Formula Ashwariders team at Formula Bharat',
    event: 'Formula Bharat 2024 EV',
    rank: 'AIR 19',
    awardName: '',
    location: 'India',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Formula Bharat', 'Electric', 'AIR 19'],
    order: 2,
    published: true,
    featured: true,
  },
  {
    id: 'ach-3',
    year: '2023',
    title: 'Formula Bharat — First On-Site Podium Push',
    description: 'In its first on-site competition, E-Formula Ashwa Riders finished 10th out of 37 electric teams at Kari Motor Speedway, Coimbatore.',
    category: 'competition',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483764/2026011201302668.jpg_1_vlfcsb.jpg',
    imageAlt: 'E-Formula Ashwa Riders at Kari Motor Speedway',
    event: 'Formula Bharat 2023 EV',
    rank: 'AIR 10',
    awardName: '',
    location: 'Coimbatore, India',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Formula Bharat', 'On-Site', 'Top 10'],
    order: 3,
    published: true,
    featured: true,
  },
  {
    id: 'ach-4',
    year: '2023',
    title: 'Formula Bharat — Combustion Category',
    description: 'Formula Ashwa Riders, our combustion team, finished 14th out of 49 registered teams at Formula Bharat 2023, held at Kari Motor Speedway.',
    category: 'competition',
    imageUrl: '',
    imageAlt: '',
    event: 'Formula Bharat 2023 CV',
    rank: 'AIR 14',
    awardName: '',
    location: 'Coimbatore, India',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Formula Bharat', 'Combustion'],
    order: 4,
    published: true,
    featured: false,
  },
  {
    id: 'ach-5',
    year: '2022',
    title: 'Formula Bharat (Virtual) — Vehicle ZEUS',
    description: 'In the virtual edition of Formula Bharat, the team competed with vehicle ZEUS, finishing 11th of 13 teams overall and reaching the semi-finals of the Endurance Event.',
    category: 'competition',
    imageUrl: '',
    imageAlt: '',
    event: 'Formula Bharat 2022 Virtual',
    rank: 'AIR 11',
    awardName: '',
    location: 'Virtual Event',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Virtual', 'ZEUS', 'Endurance'],
    order: 5,
    published: true,
    featured: false,
  },
  {
    id: 'ach-6',
    year: '2023',
    title: 'MathWorks Modelling Award',
    description: 'E-Formula Ashwa Riders ranked 5th nationally out of 86 registered teams in the MathWorks Modelling special award category at Formula Bharat 2023.',
    category: 'award',
    imageUrl: '',
    imageAlt: '',
    event: 'Formula Bharat 2023',
    rank: 'Rank 5 of 86',
    awardName: 'MathWorks Modelling Award',
    location: 'India',
    organization: 'MathWorks',
    externalUrl: '',
    tags: ['MathWorks', 'Modelling', 'National Award'],
    order: 6,
    published: true,
    featured: true,
  },
  {
    id: 'ach-7',
    year: '2023',
    title: 'Featured in Autocar India',
    description: "The team's electric Formula Student journey was featured in Autocar India's March 2023 issue, covering the debut of central India's first electric race car.",
    category: 'award',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483677/IMG-20260227-WA0016.jpg_n48hsu.jpg',
    imageAlt: 'Ashwa Riders team feature',
    event: 'Autocar India March 2023 Issue',
    rank: 'Media Feature',
    awardName: 'Press Feature',
    location: 'India',
    organization: 'Autocar India',
    externalUrl: '',
    tags: ['Autocar India', 'Press', 'Feature'],
    order: 7,
    published: true,
    featured: true,
  },
  {
    id: 'ach-8',
    year: '2023',
    title: 'Engineering Design — 10th of 37',
    description: 'E-Formula Ashwa Riders placed 10th nationally in the Engineering Design Presentation at Formula Bharat 2023, competing against 37 electric teams.',
    category: 'award',
    imageUrl: '',
    imageAlt: '',
    event: 'Formula Bharat 2023',
    rank: '10th of 37',
    awardName: 'Engineering Design Presentation',
    location: 'India',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Design Presentation', 'Engineering'],
    order: 8,
    published: true,
    featured: false,
  },
  {
    id: 'ach-9',
    year: '2015',
    title: 'Formula Ashwa Riders Founded',
    description: 'Founded by Captain Nilay Akre and Vice Captain Akshay Deotale with a vision to build a motorsport culture and engineering talent across central India.',
    category: 'record',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483679/WhatsApp_Image_2026-06-14_at_12.16.57_AM_1_ohzzaa.jpg',
    imageAlt: 'Formula Ashwa Riders founding team',
    event: 'Team Foundation',
    rank: 'Founded',
    awardName: '',
    location: 'Nagpur, India',
    organization: 'SVPCET',
    externalUrl: '',
    tags: ['Foundation', 'Nagpur', 'Combustion'],
    order: 9,
    published: true,
    featured: true,
  },
  {
    id: 'ach-10',
    year: '2020',
    title: 'E-Formula Ashwa Riders Founded',
    description: "The team's electric wing was established, making it the first Formula Student Electric team from central India.",
    category: 'record',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483675/WhatsApp_Image_2026-06-14_at_12.16.57_AM_dzrwqz.jpg',
    imageAlt: 'E-Formula Ashwa Riders electric team',
    event: 'EV Wing Inception',
    rank: 'First in Region',
    awardName: '',
    location: 'Nagpur, India',
    organization: 'SVPCET',
    externalUrl: '',
    tags: ['Electric Transition', 'First in Region'],
    order: 10,
    published: true,
    featured: true,
  },
  {
    id: 'ach-11',
    year: '2023',
    title: "Central India's First Electric FS Car",
    description: "The team designed and manufactured central India's first electric Formula Student race car ahead of its 2023 Formula Bharat debut.",
    category: 'record',
    imageUrl: '',
    imageAlt: '',
    event: 'First EV Rollout',
    rank: 'First EV',
    awardName: '',
    location: 'Nagpur, India',
    organization: 'Ashwa Riders',
    externalUrl: '',
    tags: ['First EV', 'Manufacturing', 'Central India'],
    order: 11,
    published: true,
    featured: true,
  },
  {
    id: 'ach-12',
    year: '2023-24',
    title: 'Tarkshya Unveiled',
    description: "The team unveiled its second-generation electric race car, Tarkshya, for the 2023-24 competition season.",
    category: 'record',
    imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784445596/WhatsApp_Image_2026-07-19_at_11.46.38_AM_1_b6kp8z.jpg',
    imageAlt: 'Tarkshya electric race car unveiling',
    event: 'Tarkshya Car Launch',
    rank: '2nd Generation',
    awardName: '',
    location: 'Nagpur, India',
    organization: 'Ashwa Riders',
    externalUrl: '',
    tags: ['Tarkshya', 'Gen 2', 'Unveiling'],
    order: 12,
    published: true,
    featured: true,
  },
  {
    id: 'ach-13',
    year: '2023',
    title: 'Formula Bharat Roadshow Host',
    description: 'The team co-hosted a Formula Bharat roadshow session at GEC Barton Hill, Trivandrum, helping new and aspiring teams understand the competition.',
    category: 'certificate',
    imageUrl: '',
    imageAlt: '',
    event: 'Formula Bharat Roadshow',
    rank: 'Roadshow Host',
    awardName: 'Host Certificate',
    location: 'Trivandrum, Kerala',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Roadshow', 'Mentorship', 'Outreach'],
    order: 13,
    published: true,
    featured: false,
  },
  {
    id: 'ach-14',
    year: '2024',
    title: 'Technical Inspection Cleared',
    description: 'E-Formula Ashwariders passed the demanding technical inspection at Formula Bharat 2024 with its in-house manufactured accumulator container.',
    category: 'certificate',
    imageUrl: '',
    imageAlt: '',
    event: 'Formula Bharat 2024',
    rank: 'Inspection Passed',
    awardName: 'Scrutineering Success',
    location: 'India',
    organization: 'Formula Bharat',
    externalUrl: '',
    tags: ['Scrutineering', 'Accumulator', 'Safety'],
    order: 14,
    published: true,
    featured: true,
  },
  {
    id: 'ach-15',
    year: 'Ongoing',
    title: "Central India's First Electric FS Team",
    description: 'The team continues to be recognised as the pioneering Formula Student Electric programme from central India.',
    category: 'certificate',
    imageUrl: '',
    imageAlt: '',
    event: 'Regional Recognition',
    rank: 'Pioneer Status',
    awardName: 'Pioneer Recognition',
    location: 'Nagpur, India',
    organization: 'Ashwa Riders',
    externalUrl: '',
    tags: ['Pioneer', 'Electric Mobility', 'Legacy'],
    order: 15,
    published: true,
    featured: false,
  },
];

const DEFAULT_TIMELINE_EVENTS = [
  {
    id: 'tl-1',
    year: '2015',
    title: 'The Beginning',
    description: 'Formula Ashwa Riders was founded by Captain Nilay Akre and Vice Captain Akshay Deotale to promote motorsport engineering in central India.',
    tags: ['Foundation', 'Combustion Team'],
    order: 1,
    published: true,
  },
  {
    id: 'tl-2',
    year: '2020',
    title: 'The Electric Wing Begins',
    description: 'E-Formula Ashwa Riders was established, becoming the first Formula Student Electric team from central India.',
    tags: ['First in Region', 'Electric Team'],
    order: 2,
    published: true,
  },
  {
    id: 'tl-3',
    year: '2022',
    title: 'First Formula Bharat Entry',
    description: 'Competed with vehicle ZEUS in the virtual edition of Formula Bharat, finishing 11th of 13 teams and reaching the Endurance Event semi-finals.',
    tags: ['Virtual Event', 'AIR 11'],
    order: 3,
    published: true,
  },
  {
    id: 'tl-4',
    year: '2023',
    title: 'First On-Site Competition & First EV',
    description: "Manufactured central India's first electric Formula Student car and competed on-site at Kari Motor Speedway, Coimbatore, finishing AIR 10 of 37 electric teams. Also ranked 5th of 86 teams for the MathWorks Modelling Award and was featured in Autocar India.",
    tags: ['AIR 10', 'MathWorks Award — Rank 5', 'Autocar India Feature'],
    order: 4,
    published: true,
  },
  {
    id: 'tl-5',
    year: '2023-24',
    title: 'Tarkshya Takes Shape',
    description: "Unveiled Tarkshya, the team's second-generation electric race car, ahead of the new competition season.",
    tags: ['2nd Generation Vehicle'],
    order: 5,
    published: true,
  },
  {
    id: 'tl-6',
    year: '2024',
    title: 'Best Results Yet',
    description: 'Formula Ashwariders secured overall AIR 8 with the combustion car, while E-Formula Ashwariders finished AIR 19 out of 45 electric teams nationwide.',
    tags: ['AIR 8 — Combustion', 'AIR 19 — Electric'],
    order: 6,
    published: true,
  },
  {
    id: 'tl-7',
    year: '2025 & Beyond',
    title: 'The Next Chapter',
    description: 'With two generations of electric vehicles, a growing alumni network, and a proven track record, the team is pushing for podium finishes and engineering excellence at Formula Bharat and beyond.',
    tags: ['⚡ Future Ready', 'Podium Push', 'Innovation'],
    order: 7,
    published: true,
  },
];

/**
 * Retrieve or initialize the singleton AchievementsPageContent document.
 */
const getOrSeedAchievementsPageDoc = async () => {
  let doc = await AchievementsPageContent.findOne();
  if (doc) return doc;

  console.log('⚡ Initializing Achievements Page Control Center document with authentic defaults...');

  const initialDoc = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    settings: {
      pageTitle: 'Ashwa Riders — Achievements',
      seoTitle: 'Achievements & Milestones | Ashwa Riders Formula Student Electric',
      seoDescription: 'Explore racing achievements, national awards, and engineering milestones of Ashwa Riders, Formula Student Electric team from central India.',
      ogImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483846/SAVE_20260111_173616.jpg_1_srifam.jpg',
      canonicalUrl: 'achievements.html',
      visible: true,
    },
    achievementsSection: {
      eyebrow: 'Our Achievements',
      eyebrowIcon: 'fas fa-medal',
      heading: 'Milestones That Define Us',
      headingHighlight: 'Define Us',
      description: "From our first Formula Bharat entry to building central India's first electric race car — every achievement tells a story.",
      visible: true,
      bgImageUrl: '',
      overlayStrength: 0.8,
      categories: DEFAULT_CATEGORIES,
      achievements: DEFAULT_ACHIEVEMENTS,
    },
    timelineSection: {
      eyebrow: 'Our Journey',
      eyebrowIcon: 'fas fa-history',
      heading: 'Our Timeline',
      headingHighlight: 'Timeline',
      description: "Every year brought new challenges, learnings, and results — here's how we got here.",
      bgImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784492223/IMG_9374_cile31.jpg',
      overlayStrength: 0.78,
      visible: true,
      events: DEFAULT_TIMELINE_EVENTS,
    },
  };

  initialDoc.draftVersion = JSON.parse(JSON.stringify(initialDoc));
  initialDoc.publishedVersion = JSON.parse(JSON.stringify(initialDoc));

  doc = await AchievementsPageContent.create(initialDoc);
  console.log('✅ Achievements Page Control Center document initialized successfully.');
  return doc;
};

/**
 * Dynamically computes real-time category counts based on achievements
 */
const computeCategoryCounts = (categories, achievements) => {
  const publishedAchievements = achievements.filter((a) => a.published !== false);
  const totalCount = publishedAchievements.length;

  const categoriesWithCounts = categories.map((cat) => {
    const slug = (cat.slug || '').toLowerCase();
    const count = publishedAchievements.filter((a) => (a.category || '').toLowerCase() === slug).length;
    return {
      ...cat,
      count,
    };
  });

  return {
    allCount: totalCount,
    categories: categoriesWithCounts,
  };
};

/**
 * Public Endpoint: GET /api/v1/achievements/page
 * Returns published version (or draft if ?preview=true)
 */
const getPublicAchievementsContent = async (req, res) => {
  try {
    const doc = await getOrSeedAchievementsPageDoc();
    const isPreview = req.query.preview === 'true';

    let content;
    if (isPreview && doc.draftVersion) {
      content = doc.draftVersion;
    } else if (doc.publishedVersion) {
      content = doc.publishedVersion;
    } else {
      content = doc.toObject();
    }

    // Filter achievements and timeline events for public visibility
    const visibleAchievements = (content.achievementsSection?.achievements || [])
      .filter((a) => isPreview || a.published !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const visibleCategories = (content.achievementsSection?.categories || [])
      .filter((c) => c.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const { allCount, categories: computedCategories } = computeCategoryCounts(
      visibleCategories,
      visibleAchievements
    );

    const visibleTimelineEvents = (content.timelineSection?.events || [])
      .filter((ev) => isPreview || ev.published !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return sendSuccess(res, 200, 'Achievements page content retrieved.', {
      isPreview,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      settings: content.settings,
      achievementsSection: {
        ...content.achievementsSection,
        allCount,
        categories: computedCategories,
        achievements: visibleAchievements,
      },
      timelineSection: {
        ...content.timelineSection,
        events: visibleTimelineEvents,
      },
    });
  } catch (err) {
    console.error('Error in getPublicAchievementsContent:', err);
    return sendError(res, 500, 'Error retrieving achievements content: ' + err.message);
  }
};

/**
 * Admin Endpoint: GET /api/v1/admin/achievements/page
 * Returns current draft content for the CMS Control Center
 */
const getAdminAchievementsContent = async (req, res) => {
  try {
    const doc = await getOrSeedAchievementsPageDoc();

    const data = doc.draftVersion || doc.toObject();
    const publishedData = doc.publishedVersion || doc.toObject();

    const achievements = data.achievementsSection?.achievements || [];
    const categories = data.achievementsSection?.categories || [];
    const { allCount, categories: computedCategories } = computeCategoryCounts(categories, achievements);

    // Fetch shared footer reference for status display
    const footerRef = await NavFooterSettings.findOne().lean().catch(() => null);

    return sendSuccess(res, 200, 'Achievements CMS data retrieved.', {
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      lastEditedAt: doc.lastEditedAt,
      settings: data.settings,
      achievementsSection: {
        ...data.achievementsSection,
        allCount,
        categories: computedCategories,
        achievements: data.achievementsSection?.achievements || [],
      },
      timelineSection: data.timelineSection,
      footerSummary: footerRef ? {
        lastPublishedAt: footerRef.lastPublishedAt,
        status: footerRef.status,
      } : null,
    });
  } catch (err) {
    console.error('Error in getAdminAchievementsContent:', err);
    return sendError(res, 500, 'Error loading Achievements CMS: ' + err.message);
  }
};

/**
 * Admin Endpoint: PATCH / PUT /api/v1/admin/achievements/page
 * Saves updates to draftVersion without publishing live
 */
const updateAchievementsDraft = async (req, res) => {
  try {
    const doc = await getOrSeedAchievementsPageDoc();
    const payload = req.body || {};

    const currentDraft = doc.draftVersion || doc.toObject();

    const updatedDraft = {
      ...currentDraft,
      settings: payload.settings !== undefined ? payload.settings : currentDraft.settings,
      achievementsSection: payload.achievementsSection !== undefined ? payload.achievementsSection : currentDraft.achievementsSection,
      timelineSection: payload.timelineSection !== undefined ? payload.timelineSection : currentDraft.timelineSection,
    };

    doc.draftVersion = updatedDraft;
    doc.status = 'draft';
    doc.lastEditedAt = new Date();

    await doc.save();

    return sendSuccess(res, 200, 'Achievements draft saved successfully.', {
      status: doc.status,
      version: doc.version,
      lastEditedAt: doc.lastEditedAt,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    console.error('Error in updateAchievementsDraft:', err);
    return sendError(res, 500, 'Error saving Achievements draft: ' + err.message);
  }
};

/**
 * Admin Endpoint: POST /api/v1/admin/achievements/page/publish
 * Promotes sanitized draftVersion to publishedVersion
 */
const publishAchievements = async (req, res) => {
  try {
    const doc = await getOrSeedAchievementsPageDoc();

    const draft = doc.draftVersion || doc.toObject();

    doc.publishedVersion = JSON.parse(JSON.stringify(draft));
    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    // Also update root fields for consistency
    if (draft.settings) doc.settings = draft.settings;
    if (draft.achievementsSection) doc.achievementsSection = draft.achievementsSection;
    if (draft.timelineSection) doc.timelineSection = draft.timelineSection;

    await doc.save();

    if (req.user) {
      await logActivity(
        req.user._id,
        'PUBLISH_ACHIEVEMENTS_PAGE',
        'AchievementsPageContent',
        doc._id,
        `Achievements Page v${doc.version} published live by ${req.user.fullName || req.user.email}`
      ).catch(() => {});
    }

    return sendSuccess(res, 200, 'Achievements page published live successfully!', {
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    console.error('Error in publishAchievements:', err);
    return sendError(res, 500, 'Error publishing Achievements page: ' + err.message);
  }
};

module.exports = {
  getOrSeedAchievementsPageDoc,
  getPublicAchievementsContent,
  getAdminAchievementsContent,
  updateAchievementsDraft,
  publishAchievements,
};
