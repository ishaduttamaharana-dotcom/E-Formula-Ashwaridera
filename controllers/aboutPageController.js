// ============================================================
//  controllers/aboutPageController.js
//  Unified Controller for About Page Control Center.
//  Manages all 14 About page sections, auto-seeding, lifecycle,
//  and draft/preview/publish API endpoints.
// ============================================================

const AboutContent = require('../models/AboutContent');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity, buildSnapshot } = require('../utils/publishingHelper');

/**
 * Helper to retrieve or initialize the singleton AboutContent document.
 */
const getOrSeedAboutDoc = async () => {
  let doc = await AboutContent.findOne();
  if (doc) return doc;

  console.log('⚡ Initializing About Page Control Center document with complete defaults...');

  const defaultDocData = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    settings: {
      pageTitle: 'Ashwa Riders — About Us',
      seoTitle: 'About Ashwa Riders — Formula Student Electric Team SVPCET',
      seoDescription: 'Learn about E-Formula Ashwa Riders, Central India’s first Formula Student Electric team from SVPCET Nagpur.',
      ogImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png',
      canonicalUrl: 'about.html',
    },
    hero: {
      visible: true,
      eyebrow: 'About Ashwa Riders',
      title: 'About Ashwa Riders',
      highlightText: 'Ashwa Riders',
      subtitle: 'Engineering Excellence Through Innovation',
      description: 'Ashwa Riders is the official Formula Student team of SVPCET, dedicated to designing, manufacturing, and racing Formula-style vehicles while developing future engineers through innovation, teamwork, and real-world engineering challenges.',
      desktopImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png',
      mobileImageUrl: '',
      videoUrl: '',
      posterUrl: '',
      altText: 'Ashwa Riders Formula Student Car',
      overlayOpacity: 72,
      textAlignment: 'left',
      transition: 'fade',
      duration: 700,
    },
    whoWeAre: {
      visible: true,
      eyebrow: 'Who We Are',
      title: 'Who We Are',
      highlightText: 'Who We Are',
      leadParagraph: 'We are E-Formula Ashwa Riders, the Formula Student Electric team of St. Vincent Pallotti College of Engineering & Technology (SVPCET), Nagpur — proudly the first Formula Student Electric team from Central India.',
      paragraphs: [
        'Founded in 2020, the team brings together students from Mechanical, Electrical, Electronics, Computer Science, Business, and Management to design, build, and race a fully electric Formula-style race car every season.',
        'Every member contributes to transforming ideas into a competitive electric racing machine while gaining practical experience far beyond the classroom.',
      ],
      closingStatement: "At E-Formula Ashwa Riders, students don't just study engineering — they practice it.",
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      mobileImageUrl: '',
      altText: 'E-Formula Ashwa Riders team',
      imagePosition: 'left',
    },
    story: {
      visible: true,
      eyebrow: 'Our Story',
      title: 'Every Great Race Begins With an Idea',
      highlightText: 'With an Idea',
      description: 'E-Formula Ashwa Riders was founded in 2020 at SVPCET, Nagpur, with a mission to unite Formula enthusiasts from diverse engineering backgrounds and build Central India’s first Formula Student Electric race car. We debuted at Formula Bharat 2021-22 with our first vehicle, ZEUS, and have competed on India’s biggest student motorsport stage every season since.',
      blocks: [
        {
          id: 'story-block-1',
          content: 'In 2023, our second-generation vehicle, Tarkshya, carried the team to an All India Rank of 10th out of 37 competing electric teams at Formula Bharat — ahead of squads from several IITs and NITs. Every battery pack, motor controller, chassis calculation, and line of telemetry code since has built on that foundation, guided by our team motto: Adapt. Improvise. Overcome.',
          order: 0,
          visible: true,
        },
      ],
    },
    visionMission: {
      visible: true,
      eyebrow: 'Vision & Mission',
      title: "Where We're Headed",
      highlightText: 'Headed',
      description: 'Our north star and the path we walk every day.',
      vision: {
        title: 'Our Vision',
        description: 'To be Central India’s leading Formula Student Electric team by continuously innovating in EV powertrain engineering, competing nationally at Formula Bharat, and inspiring the next generation of electric-mobility engineers.',
        icon: 'fas fa-eye',
      },
      mission: {
        title: 'Our Mission',
        description: 'We design, build, and race a competitive Formula Student Electric vehicle while advancing engineering education and sustainable mobility.',
        icon: 'fas fa-bullseye',
        bullets: [
          'Design and race a competitive Formula Student Electric vehicle',
          'Advance electric powertrain and battery engineering education',
          'Promote practical engineering education beyond the syllabus',
          'Encourage innovation and sustainable-mobility research',
          'Develop leadership and teamwork across disciplines',
          'Represent SVPCET Nagpur at Formula Bharat and national competitions',
        ],
      },
    },
    coreValues: {
      visible: true,
      eyebrow: 'Core Values',
      title: 'What We Stand For',
      highlightText: 'Stand For',
      description: 'Hover each card to discover the principles that drive us.',
      items: [
        { id: 'val-1', title: 'Innovation', description: 'We push boundaries, challenge the status quo, and embrace new ideas to engineer better solutions every season.', icon: 'fas fa-lightbulb', order: 0, visible: true },
        { id: 'val-2', title: 'Teamwork', description: 'Collaboration across disciplines is at our core. We succeed together by respecting every member’s contribution.', icon: 'fas fa-users', order: 1, visible: true },
        { id: 'val-3', title: 'Education', description: 'We believe in learning by doing and growing as engineers through hands-on challenges and real-world problem-solving.', icon: 'fas fa-graduation-cap', order: 2, visible: true },
        { id: 'val-4', title: 'Excellence', description: 'We hold ourselves to the highest standards in every aspect of our work, from design to competition.', icon: 'fas fa-trophy', order: 3, visible: true },
        { id: 'val-5', title: 'Sustainability', description: 'We champion green mobility through our electric vehicle platform and promote awareness of sustainable engineering practices.', icon: 'fas fa-seedling', order: 4, visible: true },
        { id: 'val-6', title: 'Integrity', description: 'Honesty, transparency, and ethical engineering guide our decisions and shape our team culture.', icon: 'fas fa-handshake', order: 5, visible: true },
      ],
    },
    teamStructure: {
      visible: true,
      eyebrow: 'Team Structure',
      title: "How We're Organized",
      highlightText: 'Organized',
      description: 'Click any level to view its members.',
      nodes: [
        { id: 'node-1', title: 'Faculty Coordinator', linkUrl: 'team.html#faculty-advisor', level: 1, order: 0, visible: true },
        { id: 'node-2', title: 'Captain', linkUrl: 'team.html#captain', level: 2, order: 1, visible: true },
        { id: 'node-3', title: 'Vice Captain', linkUrl: 'team.html#vice-captain', level: 3, order: 2, visible: true },
        { id: 'node-4', title: 'Department Heads', linkUrl: 'team.html#department-heads', level: 4, order: 3, visible: true },
        { id: 'node-5', title: 'Team Members', linkUrl: 'team.html#members', level: 5, order: 4, visible: true },
      ],
    },
    departments: {
      visible: true,
      eyebrow: 'Departments',
      title: 'Eleven Departments. One Machine.',
      highlightText: 'One Machine.',
      description: "Every discipline reports to the same lap-time target. Here's who builds what.",
      items: [
        { id: 'dept-1', name: 'Powertrain', icon: 'fas fa-gas-pump', teamLead: 'Team Lead', responsibilities: ['Motor & controller', 'Battery management', 'Thermal systems'], order: 0, visible: true },
        { id: 'dept-2', name: 'Drivetrain', icon: 'fas fa-cogs', teamLead: 'Team Lead', responsibilities: ['Transmission', 'Differential', 'Axles & bearings'], order: 1, visible: true },
        { id: 'dept-3', name: 'Aerodynamics', icon: 'fas fa-wind', teamLead: 'Team Lead', responsibilities: ['CFD & FEA', 'Wings & bodywork', 'Downforce optimization'], order: 2, visible: true },
        { id: 'dept-4', name: 'Data Acquisition', icon: 'fas fa-chart-line', teamLead: 'Team Lead', responsibilities: ['Telemetry', 'Sensors & logging', 'Data analysis'], order: 3, visible: true },
        { id: 'dept-5', name: 'Vehicle Dynamics', icon: 'fas fa-car', teamLead: 'Team Lead', responsibilities: ['Handling & setup', 'Kinematics', 'Tire modelling'], order: 4, visible: true },
        { id: 'dept-6', name: 'System Integration', icon: 'fas fa-microchip', teamLead: 'Team Lead', responsibilities: ['ECU & wiring', 'Controls', 'Dashboard & UI'], order: 5, visible: true },
        { id: 'dept-7', name: 'Firmware', icon: 'fas fa-code', teamLead: 'Team Lead', responsibilities: ['Embedded C', 'Low-level control', 'RTOS & comms'], order: 6, visible: true },
        { id: 'dept-8', name: 'Brakes', icon: 'fas fa-circle', teamLead: 'Team Lead', responsibilities: ['Hydraulics', 'Disc & caliper', 'ABS strategy'], order: 7, visible: true },
        { id: 'dept-9', name: 'Steering', icon: 'fas fa-steering-wheel', teamLead: 'Team Lead', responsibilities: ['Rack & pinion', 'Column & quick-release', 'Driver feedback'], order: 8, visible: true },
        { id: 'dept-10', name: 'Suspension', icon: 'fas fa-arrows-alt-v', teamLead: 'Team Lead', responsibilities: ['Springs & dampers', 'Anti-roll bars', 'Uprights & wishbones'], order: 9, visible: true },
      ],
    },
    process: {
      visible: true,
      eyebrow: 'Our Process',
      title: 'How We Build a Formula Car',
      highlightText: 'Formula Car',
      description: 'Click a stage to see what it involves.',
      stages: [
        { id: 'stage-1', stepNumber: '01', name: 'Research', description: "We study last season's data, rulebook changes, and competitor designs to set performance targets for the new car.", order: 0, visible: true },
        { id: 'stage-2', stepNumber: '02', name: 'Concept Design', description: 'Cross-department reviews translate targets into a system architecture — chassis layout, battery and motor package, and packaging constraints.', order: 1, visible: true },
        { id: 'stage-3', stepNumber: '03', name: 'CAD Modeling', description: 'Every component is modelled in full assembly CAD before a single part is manufactured, catching fit and clearance issues early.', order: 2, visible: true },
        { id: 'stage-4', stepNumber: '04', name: 'Simulation', description: 'FEA, CFD, and lap-time simulation validate structural integrity, aero performance, and expected track performance.', order: 3, visible: true },
        { id: 'stage-5', stepNumber: '05', name: 'Manufacturing', description: 'Parts are machined, welded, and composited in-house and with manufacturing partners, following our build drawings exactly.', order: 4, visible: true },
        { id: 'stage-6', stepNumber: '06', name: 'Assembly', description: 'Sub-systems come together on the rolling chassis, with torque specs and wiring checked against the build manual.', order: 5, visible: true },
        { id: 'stage-7', stepNumber: '07', name: 'Testing', description: 'Shakedown runs, endurance simulation, and driver seat-time tune the car before it ever reaches scrutineering.', order: 6, visible: true },
        { id: 'stage-8', stepNumber: '08', name: 'Competition', description: 'Scrutineering, static events, and dynamic events at Formula Bharat — the culmination of a full season’s work.', order: 7, visible: true },
      ],
    },
    formulaBharat: {
      visible: true,
      eyebrow: 'Why Formula Bharat?',
      title: 'Formula Bharat',
      highlightText: 'Bharat',
      description: "Formula Bharat is India's premier Formula Student competition, held annually at the Kari Motor Speedway in Coimbatore, where engineering teams design, manufacture, and compete with Formula-style race cars in combustion and electric categories. E-Formula Ashwa Riders has competed at Formula Bharat every season since our 2021-22 debut with ZEUS, improving to an All India Rank of 10th out of 37 electric teams in 2023 with Tarkshya, and returning to compete again at Formula Bharat 2025.",
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784445596/WhatsApp_Image_2026-07-19_at_11.46.38_AM_1_b6kp8z.jpg',
      altText: 'E-Formula Ashwa Riders at Formula Bharat',
      facts: [
        { id: 'fact-1', label: 'Engineering Design', order: 0, visible: true },
        { id: 'fact-2', label: 'Cost & Manufacturing', order: 1, visible: true },
        { id: 'fact-3', label: 'Business Presentation', order: 2, visible: true },
        { id: 'fact-4', label: 'Acceleration', order: 3, visible: true },
        { id: 'fact-5', label: 'Skidpad', order: 4, visible: true },
        { id: 'fact-6', label: 'Autocross', order: 5, visible: true },
        { id: 'fact-7', label: 'Endurance', order: 6, visible: true },
      ],
    },
    workshop: {
      visible: true,
      eyebrow: 'Workshop',
      title: 'Where It All Comes Together',
      highlightText: 'Comes Together',
      description: 'Inside our dedicated fabrication and assembly facility.',
      items: [
        { id: 'ws-1', title: 'CAD Lab', icon: 'fas fa-cube', imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483846/SAVE_20260111_173616.jpg_1_srifam.jpg', order: 0, visible: true },
        { id: 'ws-2', title: 'Manufacturing', icon: 'fas fa-industry', imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483829/1768116510403.jpg_1_ibfo5t.jpg', order: 1, visible: true },
        { id: 'ws-3', title: 'Assembly', icon: 'fas fa-toolbox', imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483764/2026011201302668.jpg_1_vlfcsb.jpg', order: 2, visible: true },
        { id: 'ws-4', title: 'Testing', icon: 'fas fa-gauge-high', imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483702/WhatsApp_Image_2026-06-14_at_12.13.28_AM_h0tl39.jpg', order: 3, visible: true },
        { id: 'ws-5', title: 'Workshop', icon: 'fas fa-warehouse', imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483677/IMG-20260227-WA0016.jpg_n48hsu.jpg', order: 4, visible: true },
        { id: 'ws-6', title: 'Competition Prep', icon: 'fas fa-flag-checkered', imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483679/WhatsApp_Image_2026-06-14_at_12.16.57_AM_1_ohzzaa.jpg', order: 5, visible: true },
      ],
    },
    peopleMessages: {
      visible: true,
      eyebrow: 'Faculty & Leadership',
      title: 'Words From Our Guidance & Leadership',
      description: 'Insights from faculty advisors and team leaders.',
      messages: [
        {
          id: 'msg-1',
          personType: 'Faculty Coordinator',
          name: 'Prof. Atul Kumar Saxena',
          role: 'Faculty Coordinator, E-Formula Ashwa Riders',
          photoUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483675/WhatsApp_Image_2026-06-14_at_12.16.57_AM_dzrwqz.jpg',
          quote: "Formula Bharat gives our students a rare chance to apply theory under real constraints — budget, time, and physics don't negotiate. Watching them design, fail, iterate, and improve every season is the best teaching we do all year.",
          description: '',
          linkedinUrl: '#',
          order: 0,
          visible: true,
        },
        {
          id: 'msg-2',
          personType: 'Team Captain',
          name: 'Shreyash Gaikwad',
          role: 'Team Captain, Formula Bharat 2023 Season',
          photoUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
          quote: 'Every battery cell balanced and every calculation completed brings us one step closer to the finish line at Formula Bharat.',
          description: '',
          linkedinUrl: '#',
          order: 1,
          visible: true,
        },
      ],
    },
    whyJoin: {
      visible: true,
      eyebrow: 'Why Join Ashwa Riders',
      title: "Skills You'll Actually Use",
      highlightText: 'Use',
      description: 'Members learn far beyond the classroom syllabus.',
      skills: [
        { id: 'sk-1', name: 'CAD', description: '3D Solid Modeling & Assembly Design', icon: 'fas fa-cube', order: 0, visible: true },
        { id: 'sk-2', name: 'Simulation', description: 'FEA & CFD Structural / Aero Analysis', icon: 'fas fa-chart-line', order: 1, visible: true },
        { id: 'sk-3', name: 'Manufacturing', description: 'Machining, Welding & Composite Layups', icon: 'fas fa-industry', order: 2, visible: true },
        { id: 'sk-4', name: 'Battery & BMS', description: 'High Voltage EV Systems & Cell Balancing', icon: 'fas fa-car-battery', order: 3, visible: true },
        { id: 'sk-5', name: 'Project Management', description: 'Gantt Charts, Budgeting & Timeline Execution', icon: 'fas fa-tasks', order: 4, visible: true },
        { id: 'sk-6', name: 'Leadership', description: 'Cross-functional Team Lead Experience', icon: 'fas fa-users-cog', order: 5, visible: true },
        { id: 'sk-7', name: 'Marketing', description: 'Sponsor Outreach & Social Branding', icon: 'fas fa-bullhorn', order: 6, visible: true },
        { id: 'sk-8', name: 'Public Speaking', description: 'Design Judging & Business Presentations', icon: 'fas fa-microphone', order: 7, visible: true },
        { id: 'sk-9', name: 'Industry Collaboration', description: 'Working with OEM Engineering Sponsors', icon: 'fas fa-handshake', order: 8, visible: true },
      ],
    },
    cta: {
      visible: true,
      eyebrow: 'Get Involved',
      title: 'Ready to Race With Us?',
      highlightText: 'Race',
      description: 'Join a team of passionate engineers and innovators, or help power our next season as a sponsor.',
      primaryBtnText: 'Become a Team Member',
      primaryBtnUrl: 'index.html#recruitment',
      primaryBtnVisible: true,
      secondaryBtnText: 'Become a Sponsor',
      secondaryBtnUrl: 'sponsors.html',
      secondaryBtnVisible: true,
      backgroundStyle: 'dark',
    },
  };

  if (!doc) {
    console.log('⚡ Initializing About Page Control Center document with complete defaults...');
    doc = new AboutContent(defaultDocData);
    doc.publishedVersion = buildSnapshot(doc.toObject());
    doc.draftVersion = buildSnapshot(doc.toObject());
    await doc.save();
    return doc;
  }

  // Migrate legacy document to ensure all 14 sections are populated
  let needsSave = false;
  const sections = [
    'settings', 'hero', 'whoWeAre', 'story', 'visionMission',
    'coreValues', 'teamStructure', 'departments', 'process',
    'formulaBharat', 'workshop', 'peopleMessages', 'whyJoin', 'cta'
  ];

  sections.forEach((sec) => {
    const currentSec = doc[sec];
    if (!currentSec || (typeof currentSec === 'object' && Object.keys(currentSec.toObject ? currentSec.toObject() : currentSec).length <= 1)) {
      doc.set(sec, defaultDocData[sec]);
      needsSave = true;
    } else if (defaultDocData[sec].items && (!currentSec.items || currentSec.items.length === 0)) {
      doc.set(sec, defaultDocData[sec]);
      needsSave = true;
    }
  });

  if (!doc.publishedVersion || !doc.publishedVersion.whoWeAre || !doc.publishedVersion.departments) {
    doc.publishedVersion = buildSnapshot(doc.toObject());
    needsSave = true;
  }
  if (!doc.draftVersion || !doc.draftVersion.whoWeAre || !doc.draftVersion.departments) {
    doc.draftVersion = buildSnapshot(doc.toObject());
    needsSave = true;
  }

  if (needsSave) {
    doc.status = 'published';
    await doc.save();
    console.log('✅ Migrated AboutContent to complete 14-section schema with published snapshot.');
  }

  return doc;
};

/**
 * GET /api/v1/admin/about
 * Admin endpoint: Retrieves the unified About Page Control Center document.
 */
const getAdminAboutContent = async (req, res) => {
  try {
    const doc = await getOrSeedAboutDoc();
    const data = doc.toObject ? doc.toObject() : doc;
    return sendSuccess(res, 200, 'About page control center content retrieved.', data);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving about content: ' + err.message);
  }
};

/**
 * PATCH /api/v1/admin/about
 * Admin endpoint: Updates draft changes for the About page.
 */
const updateAboutDraft = async (req, res) => {
  try {
    const body = req.body || {};
    const rawString = JSON.stringify(body);
    const payloadBytes = req.headers['content-length'] || Buffer.byteLength(rawString);
    console.log(`[ABOUT CMS] Update draft request received. Payload size: ${payloadBytes} bytes`);

    // Strict validation: Reject raw base64 media binaries
    if (/data:(image|video)\/[a-zA-Z0-9+]+;base64/.test(rawString)) {
      console.warn('[ABOUT CMS] Rejected draft update: raw base64 data URI detected in payload.');
      return sendError(res, 400, 'Invalid media format: Raw base64 data detected. Media files must be uploaded separately via the media uploader and stored as Cloudinary URLs.');
    }

    const doc = await getOrSeedAboutDoc();

    const sections = [
      'settings', 'hero', 'whoWeAre', 'story', 'visionMission',
      'coreValues', 'teamStructure', 'departments', 'process',
      'formulaBharat', 'workshop', 'peopleMessages', 'whyJoin', 'cta'
    ];

    sections.forEach((sec) => {
      if (body[sec] !== undefined) {
        doc.set(sec, body[sec]);
      }
    });

    doc.draftVersion = buildSnapshot(doc.toObject());
    doc.status = 'draft';
    doc.version += 1;
    doc.lastEditedAt = new Date();
    doc.updatedBy = req.user ? req.user._id : null;

    await doc.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_DRAFT',
      resource: 'AboutPage',
      summary: 'Saved About page draft changes',
      req,
    });

    return sendSuccess(res, 200, 'About page draft saved successfully.', doc);
  } catch (err) {
    return sendError(res, 400, 'Error updating about page draft: ' + err.message);
  }
};

/**
 * POST /api/v1/admin/about/publish
 * Admin endpoint: Promotes current draft to published status and makes it live on the website.
 */
const publishAbout = async (req, res) => {
  try {
    const doc = await getOrSeedAboutDoc();

    const snapshot = doc.draftVersion || buildSnapshot(doc.toObject());
    doc.publishedVersion = snapshot;
    doc.status = 'published';
    doc.version += 1;
    doc.lastPublishedAt = new Date();
    doc.updatedBy = req.user ? req.user._id : null;

    await doc.save();

    await logActivity({
      user: req.user,
      action: 'PUBLISH',
      resource: 'AboutPage',
      summary: `Published About page version (v${doc.version})`,
      req,
    });

    return sendSuccess(res, 200, 'About page published successfully. Public website updated.', doc);
  } catch (err) {
    return sendError(res, 500, 'Error publishing about page: ' + err.message);
  }
};

/**
 * GET /api/v1/admin/about/preview
 * Admin endpoint: Retrieves preview content (current draft).
 */
const getAboutPreview = async (req, res) => {
  try {
    const doc = await getOrSeedAboutDoc();
    const data = doc.draftVersion || doc.publishedVersion || doc.toObject();
    return sendSuccess(res, 200, 'About page preview content retrieved.', data);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving preview content: ' + err.message);
  }
};

/**
 * GET /api/v1/about
 * Public endpoint: Returns published content for the About page.
 * If req.query.preview === 'true', returns draftVersion.
 */
const getPublicAbout = async (req, res) => {
  try {
    const doc = await getOrSeedAboutDoc();
    const isPreview = req.query.preview === 'true';

    let data;
    if (isPreview && doc.draftVersion) {
      data = doc.draftVersion;
    } else {
      data = doc.publishedVersion || doc.toObject();
    }

    const publicPayload = {
      settings: data.settings,
      hero: data.hero,
      whoWeAre: data.whoWeAre,
      story: data.story,
      visionMission: data.visionMission,
      coreValues: data.coreValues,
      teamStructure: data.teamStructure,
      departments: data.departments,
      process: data.process,
      formulaBharat: data.formulaBharat,
      workshop: data.workshop,
      peopleMessages: data.peopleMessages,
      whyJoin: data.whyJoin,
      cta: data.cta,
      version: data.version,
      lastPublishedAt: data.lastPublishedAt,
      isPreview,
    };

    return sendSuccess(res, 200, 'About page content retrieved.', publicPayload);
  } catch (err) {
    return sendError(res, 500, 'Error retrieving about page content: ' + err.message);
  }
};

module.exports = {
  getOrSeedAboutDoc,
  getAdminAboutContent,
  updateAboutDraft,
  publishAbout,
  getAboutPreview,
  getPublicAbout,
};
