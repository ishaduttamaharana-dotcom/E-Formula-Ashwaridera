// ============================================================
//  controllers/carPageController.js
//  Unified Controller for Car Page Control Center.
//  Sections:
//    01. Car Experience (5 Stages: 00 HERO to 04 FINAL)
//    02. Vehicle Values / Key Specifications (4 Spec Blocks)
//    03. Engineering Systems (Tabs: Chassis, Suspension, Aero, etc.)
//    04. The Build Journey (Horizontal Timeline Phases)
//    05. Visual Breakdown (In the Details Masonry Grid)
//    06. Open Positions (Recruitment CTA Section)
//  Draft / Preview / Publish lifecycle with lightweight JSON only.
// ============================================================

const CarPageContent = require('../models/CarPageContent');
const CarSpec = require('../models/CarSpec');
const NavFooterSettings = require('../models/NavFooterSettings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const DEFAULT_STAGES = [
  {
    id: 'stage-0',
    stageNumber: 0,
    stageName: 'HERO',
    eyebrow: '// 2026 E-Formula',
    heading: 'Ashwa-3 Race Car',
    headingHighlight: '-3',
    description: "India's most advanced Formula Student electric race car. Engineered for precision, built for speed.",
    mediaUrl: 'assets/videotophoto/ezgif-frame-001.jpg',
    frameNumber: '001',
    minScroll: 0.00,
    maxScroll: 0.15,
    stats: [
      { label: 'Peak Power', value: '120', unit: 'kW' },
      { label: '0–100 km/h', value: '3.2', unit: 'sec' },
    ],
    primaryCta: { text: 'Explore Specs', link: '#specs-section', enabled: true },
    secondaryCta: { text: 'Join Team', link: 'index.html#recruitment', enabled: true },
    order: 1,
    published: true,
  },
  {
    id: 'stage-1',
    stageNumber: 1,
    stageName: 'REVEAL',
    eyebrow: 'Stage 01 // Reveal',
    heading: 'Engineered Without Compromise',
    headingHighlight: 'Without',
    description: 'Scroll deeper as internal mechanical components separate and body panels unveil raw carbon engineering beneath.',
    mediaUrl: '',
    frameNumber: '015',
    minScroll: 0.15,
    maxScroll: 0.40,
    stats: [
      { label: 'Frame Weight', value: '28', unit: 'kg' },
      { label: 'Downforce', value: '450', unit: 'kg' },
    ],
    primaryCta: { text: '', link: '', enabled: false },
    secondaryCta: { text: '', link: '', enabled: false },
    order: 2,
    published: true,
  },
  {
    id: 'stage-2',
    stageNumber: 2,
    stageName: 'TECH',
    eyebrow: 'Stage 02 // Tech',
    heading: 'Precision in Every Component',
    headingHighlight: 'Every',
    description: 'Double wishbone Öhlins TTX suspension, 600V battery pack, and Motec M150 ECU in perfect synchronicity.',
    mediaUrl: '',
    frameNumber: '040',
    minScroll: 0.40,
    maxScroll: 0.65,
    stats: [
      { label: 'Voltage', value: '600', unit: 'V' },
      { label: 'Sensors', value: '40', unit: '+Ch' },
    ],
    primaryCta: { text: '', link: '', enabled: false },
    secondaryCta: { text: '', link: '', enabled: false },
    order: 3,
    published: true,
  },
  {
    id: 'stage-3',
    stageNumber: 3,
    stageName: 'PERFORMANCE',
    eyebrow: 'Stage 03 // Performance',
    heading: 'Built to Move You',
    headingHighlight: 'Move',
    description: 'Extreme downforce, active DRS drag reduction, and real-time AI telematics engineered to shatter lap records.',
    mediaUrl: '',
    frameNumber: '065',
    minScroll: 0.65,
    maxScroll: 0.85,
    stats: [
      { label: 'Top Speed', value: '140', unit: 'km/h' },
      { label: 'Torque', value: '240', unit: 'Nm' },
    ],
    primaryCta: { text: '', link: '', enabled: false },
    secondaryCta: { text: '', link: '', enabled: false },
    order: 4,
    published: true,
  },
  {
    id: 'stage-4',
    stageNumber: 4,
    stageName: 'FINAL',
    eyebrow: 'Stage 04 // Final Hero',
    heading: "Built for What's Next.",
    headingHighlight: "What's",
    description: 'Components return to full assembly. The race car is ready to set new benchmarks on circuit.',
    mediaUrl: '',
    frameNumber: '085',
    minScroll: 0.85,
    maxScroll: 1.00,
    stats: [
      { label: 'Total Power', value: '120', unit: 'kW' },
      { label: 'Total Weight', value: '220', unit: 'kg' },
    ],
    primaryCta: { text: 'Join Team', link: 'index.html#recruitment', enabled: true },
    secondaryCta: { text: '', link: '', enabled: false },
    order: 5,
    published: true,
  },
];

const DEFAULT_KEY_SPECS = [
  {
    id: 'spec-1',
    label: 'Peak Power',
    value: '120',
    unit: 'kW',
    description: 'Electric Motor Output',
    highlight: true,
    order: 1,
    visible: true,
  },
  {
    id: 'spec-2',
    label: '0–100 km/h',
    value: '3.0',
    unit: 's',
    description: 'Sprint Acceleration',
    highlight: true,
    order: 2,
    visible: true,
  },
  {
    id: 'spec-3',
    label: 'Downforce',
    value: '450',
    unit: 'kg',
    description: '@ 100 km/h',
    highlight: false,
    order: 3,
    visible: true,
  },
  {
    id: 'spec-4',
    label: 'Vehicle Weight',
    value: '220',
    unit: 'kg',
    description: 'Total with Driver',
    highlight: false,
    order: 4,
    visible: true,
  },
];

const DEFAULT_ENGINEERING_CATEGORIES = [
  {
    id: 'chassis',
    name: 'Chassis',
    icon: 'fas fa-cubes',
    order: 1,
    visible: true,
    cards: [
      {
        id: 'card-chassis-1',
        title: 'Carbon Monocoque Chassis',
        description: 'Full carbon fiber monocoque designed for maximum structural rigidity and driver safety conforming to FIA Formula Student standards.',
        icon: 'fas fa-cubes',
        isFullWidth: false,
        specs: [
          { label: 'Material', value: 'Carbon Fiber / Honeycomb' },
          { label: 'Weight', value: '28 kg' },
          { label: 'Torsional Rigidity', value: '45,000 Nm/deg' },
          { label: 'Safety Standard', value: 'FIA Formula Student' },
        ],
        order: 1,
      },
      {
        id: 'card-chassis-2',
        title: 'Chassis Dimensions',
        description: 'Optimized geometry providing ideal weight distribution and driver ergonomics at maximum cornering loads.',
        icon: 'fas fa-ruler-combined',
        isFullWidth: false,
        specs: [
          { label: 'Wheelbase', value: '1,550 mm' },
          { label: 'Front Track', value: '1,200 mm' },
          { label: 'Rear Track', value: '1,180 mm' },
          { label: 'CoG Height', value: '265 mm' },
        ],
        order: 2,
      },
    ],
  },
  {
    id: 'suspension',
    name: 'Suspension',
    icon: 'fas fa-car-side',
    order: 2,
    visible: true,
    cards: [
      {
        id: 'card-susp-1',
        title: 'Suspension Architecture',
        description: 'Double wishbone push-rod suspension at all four corners delivers precise handling and adjustable setup for varying circuit conditions.',
        icon: 'fas fa-car-side',
        isFullWidth: false,
        specs: [
          { label: 'Type', value: 'Double Wishbone Push-Rod' },
          { label: 'Dampers', value: 'Öhlins TTX 2-way' },
          { label: 'Anti-roll Bars', value: 'Adjustable Front & Rear' },
          { label: 'Wheel Travel', value: '60 mm' },
        ],
        order: 1,
      },
      {
        id: 'card-susp-2',
        title: 'Braking System',
        description: 'Carbon-ceramic brake discs with regenerative braking blended to maximize energy recovery under deceleration.',
        icon: 'fas fa-circle-dot',
        isFullWidth: false,
        specs: [
          { label: 'Front Discs', value: 'Carbon-Ceramic 260mm' },
          { label: 'Calipers', value: '4-Piston Brembo' },
          { label: 'Regen Braking', value: 'Up to 80 kW recovery' },
          { label: 'Brake Bias', value: 'Adjustable 40–60%' },
        ],
        order: 2,
      },
    ],
  },
  {
    id: 'aero',
    name: 'Aerodynamics',
    icon: 'fas fa-wind',
    order: 3,
    visible: true,
    cards: [
      {
        id: 'card-aero-1',
        title: 'Aerodynamics Package',
        description: 'Full CFD-optimized aerodynamic suite delivering exceptional downforce-to-drag ratios for both high-speed stability and cornering grip.',
        icon: 'fas fa-wind',
        isFullWidth: false,
        specs: [
          { label: 'Downforce @ 100 km/h', value: '450 kg' },
          { label: 'Drag Coefficient (Cd)', value: '0.68' },
          { label: 'Front Wing', value: '3-Element Carbon' },
          { label: 'Rear Wing', value: '2-Element + Active DRS' },
        ],
        order: 1,
      },
      {
        id: 'card-aero-2',
        title: 'Underbody & Diffuser',
        description: 'Ground-effect underbody channels airflow through a full-width rear diffuser generating significant venturi suction at speed.',
        icon: 'fas fa-table-cells',
        isFullWidth: false,
        specs: [
          { label: 'Underbody', value: 'Carbon Ground Effect' },
          { label: 'Diffuser', value: 'Full-Width 9-Channel' },
          { label: 'DRS Range', value: '0–12° Active Adjustment' },
          { label: 'Sidepods', value: 'Undercut Carbon Composite' },
        ],
        order: 2,
      },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'fas fa-microchip',
    order: 4,
    visible: true,
    cards: [
      {
        id: 'card-elec-1',
        title: 'Vehicle Control Unit',
        description: 'Motec M150 ECU running proprietary real-time vehicle control software, power management, and safety interlocks.',
        icon: 'fas fa-microchip',
        isFullWidth: false,
        specs: [
          { label: 'ECU', value: 'Motec M150' },
          { label: 'Sensors', value: '40+ Active Channels' },
          { label: 'Telemetry', value: '4G / Wi-Fi Real-time' },
          { label: 'Data Logging', value: '100 Hz Frequency' },
        ],
        order: 1,
      },
      {
        id: 'card-elec-2',
        title: 'Battery System',
        description: '600V high-voltage lithium-ion battery pack with active thermal management and multi-layer BMS protection.',
        icon: 'fas fa-battery-full',
        isFullWidth: false,
        specs: [
          { label: 'Pack Voltage', value: '600 V nominal' },
          { label: 'Capacity', value: '7.2 kWh usable' },
          { label: 'Thermal Mgmt.', value: 'Active liquid cooling' },
          { label: 'BMS', value: 'Multi-layer protection' },
        ],
        order: 2,
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI & Data',
    icon: 'fas fa-brain',
    order: 5,
    visible: true,
    cards: [
      {
        id: 'card-ai-1',
        title: 'AI & Predictive Performance',
        description: 'Machine learning models running on-board analyze lap telematics in real-time for thermal optimization, traction control, and race strategy simulation.',
        icon: 'fas fa-brain',
        isFullWidth: true,
        specs: [
          { label: 'Telemetry AI', value: 'Real-time lap analytics' },
          { label: 'Predictive Model', value: 'Thermal & energy forecasting' },
          { label: 'Driver Assist', value: 'Dynamic traction slip control' },
          { label: 'Race Strategy', value: 'Automated stint simulations' },
          { label: 'Vision System', value: 'Camera-based track mapping' },
          { label: 'Compute Platform', value: 'NVIDIA Jetson embedded AI' },
        ],
        order: 1,
      },
    ],
  },
];

const DEFAULT_BUILD_PHASES = [
  {
    id: 'phase-1',
    phaseNumber: '01',
    title: 'Concept & Design',
    description: 'Defining aerodynamic goals, suspension geometry, and electric powertrain layout using simulation tools.',
    icon: 'fas fa-pencil-ruler',
    dateTag: 'Sep 2024 — Nov 2024',
    isDone: true,
    order: 1,
    visible: true,
  },
  {
    id: 'phase-2',
    phaseNumber: '02',
    title: 'CAD & Simulation',
    description: 'Full 3D modeling in CATIA V5 with CFD aero analysis and structural FEA stress testing.',
    icon: 'fas fa-drafting-compass',
    dateTag: 'Nov 2024 — Jan 2025',
    isDone: true,
    order: 2,
    visible: true,
  },
  {
    id: 'phase-3',
    phaseNumber: '03',
    title: 'Fabrication',
    description: 'Carbon fiber monocoque layup, CNC machined uprights, and welded sub-frame assembly completed.',
    icon: 'fas fa-tools',
    dateTag: 'Jan 2025 — Apr 2025',
    isDone: true,
    order: 3,
    visible: true,
  },
  {
    id: 'phase-4',
    phaseNumber: '04',
    title: 'Electronics Integration',
    description: '600V battery pack installation, wiring harness routing, ECU mapping and sensor calibration.',
    icon: 'fas fa-bolt',
    dateTag: 'Apr 2025 — Jun 2025',
    isDone: true,
    order: 4,
    visible: true,
  },
  {
    id: 'phase-5',
    phaseNumber: '05',
    title: 'Testing & Tuning',
    description: 'Skid-pad, autocross, and endurance testing with real-time telemetry data to refine setup.',
    icon: 'fas fa-tachometer-alt',
    dateTag: 'Jun 2025 — Aug 2025',
    isDone: true,
    order: 5,
    visible: true,
  },
  {
    id: 'phase-6',
    phaseNumber: '06',
    title: 'Race Day',
    description: 'Full competition events including acceleration, skid-pad, autocross, and 22km endurance run.',
    icon: 'fas fa-flag-checkered',
    dateTag: 'Formula Bharat 2026',
    isDone: false,
    order: 6,
    visible: true,
  },
];

const DEFAULT_VISUAL_CARDS = [
  {
    id: 'vis-1',
    title: 'Front Aero Wing',
    imageUrl: '',
    altText: 'Ashwa-3 front aero wing carbon composite',
    isFeatured: true,
    order: 1,
    visible: true,
  },
  {
    id: 'vis-2',
    title: 'Carbon Monocoque',
    imageUrl: '',
    altText: 'Full carbon monocoque chassis structure',
    isFeatured: false,
    order: 2,
    visible: true,
  },
  {
    id: 'vis-3',
    title: '600V Battery Module',
    imageUrl: '',
    altText: 'High voltage lithium-ion battery system',
    isFeatured: false,
    order: 3,
    visible: true,
  },
  {
    id: 'vis-4',
    title: 'Rear Diffuser & DRS',
    imageUrl: '',
    altText: 'Ground effect diffuser and active DRS wing',
    isFeatured: false,
    order: 4,
    visible: true,
  },
  {
    id: 'vis-5',
    title: 'Öhlins Suspension',
    imageUrl: '',
    altText: 'Double wishbone pushrod Öhlins TTX dampers',
    isFeatured: false,
    order: 5,
    visible: true,
  },
];

/**
 * Retrieve or initialize the singleton CarPageContent document.
 */
const getOrSeedCarDoc = async () => {
  let doc = await CarPageContent.findOne();
  if (doc) return doc;

  console.log('⚡ Initializing Car Page Control Center document with authentic defaults...');

  const initialDoc = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    carExperience: {
      visible: true,
      totalFrames: 240,
      framePattern: 'assets/videotophoto/ezgif-frame-{num}.jpg',
      stages: DEFAULT_STAGES,
    },
    keySpecs: DEFAULT_KEY_SPECS,
    engineeringSection: {
      visible: true,
      eyebrow: 'Engineering Systems',
      heading: 'Built for Performance',
      headingHighlight: 'Performance',
      description: 'Every vehicle subsystem is engineered to operate in total harmony at race speed.',
      watermarkText: 'TECH',
      categories: DEFAULT_ENGINEERING_CATEGORIES,
    },
    buildJourneySection: {
      visible: true,
      eyebrow: 'From Concept to Circuit',
      heading: 'The Build Journey',
      headingHighlight: 'Journey',
      description: 'Ashwa-3 was designed, fabricated, and tested entirely by our student engineering team over 14 months.',
      phases: DEFAULT_BUILD_PHASES,
    },
    visualBreakdownSection: {
      visible: true,
      eyebrow: 'Visual Breakdown',
      heading: 'In the Details',
      headingHighlight: 'Details',
      description: 'A closer look at Ashwa-3\'s high-performance precision craftsmanship and engineering systems.',
      cards: DEFAULT_VISUAL_CARDS,
    },
    openPositionsSection: {
      visible: true,
      eyebrow: 'Open Positions',
      heading: 'Want to Build the Next Machine?',
      headingHighlight: 'Next Machine?',
      description: 'Join our team of engineers and help design, build, and race the next generation of Ashwa Formula cars.',
      primaryCta: {
        text: 'Join the Team',
        link: 'index.html#recruitment',
        enabled: true,
      },
      secondaryCta: {
        text: 'Get in Touch',
        link: 'contact.html',
        enabled: true,
      },
    },
  };

  initialDoc.draftVersion = JSON.parse(JSON.stringify(initialDoc));
  initialDoc.publishedVersion = JSON.parse(JSON.stringify(initialDoc));

  doc = await CarPageContent.create(initialDoc);
  console.log('✅ Car Page Control Center document initialized successfully.');
  return doc;
};

/**
 * Public Endpoint: GET /api/v1/car/page
 * Supports ?preview=true for previewing draft content
 */
const getPublicCarContent = async (req, res) => {
  try {
    const doc = await getOrSeedCarDoc();
    const isPreview = req.query.preview === 'true';

    let content = isPreview
      ? doc.draftVersion || doc.toObject()
      : doc.publishedVersion || doc.toObject();

    // Filter visible stages
    const visibleStages = (content.carExperience?.stages || [])
      .filter((s) => isPreview || s.published !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter visible key specs
    const visibleKeySpecs = (content.keySpecs || [])
      .filter((s) => isPreview || s.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter visible engineering categories and cards
    const visibleEngineering = {
      ...content.engineeringSection,
      categories: (content.engineeringSection?.categories || [])
        .filter((cat) => isPreview || cat.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((cat) => ({
          ...cat,
          cards: (cat.cards || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
        })),
    };

    // Filter visible build journey phases
    const visibleBuildPhases = (content.buildJourneySection?.phases || [])
      .filter((p) => isPreview || p.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Filter visible visual breakdown cards
    const visibleVisualCards = (content.visualBreakdownSection?.cards || [])
      .filter((v) => isPreview || v.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return sendSuccess(res, 200, 'Car page content retrieved.', {
      isPreview,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      carExperience: {
        ...content.carExperience,
        stages: visibleStages,
      },
      keySpecs: visibleKeySpecs,
      engineeringSection: visibleEngineering,
      buildJourneySection: {
        ...content.buildJourneySection,
        phases: visibleBuildPhases,
      },
      visualBreakdownSection: {
        ...content.visualBreakdownSection,
        cards: visibleVisualCards,
      },
      openPositionsSection: content.openPositionsSection,
    });
  } catch (err) {
    console.error('Error in getPublicCarContent:', err);
    return sendError(res, 500, 'Error retrieving Car content: ' + err.message);
  }
};

/**
 * Admin Endpoint: GET /api/v1/admin/car/page (and /admin/car)
 * Returns current draft content for the CMS Control Center
 */
const getAdminCarContent = async (req, res) => {
  try {
    const doc = await getOrSeedCarDoc();

    const data = doc.draftVersion || doc.toObject();

    // Fetch shared footer reference for status display
    const footerRef = await NavFooterSettings.findOne().lean().catch(() => null);

    return sendSuccess(res, 200, 'Car CMS data retrieved.', {
      page: doc,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      lastEditedAt: doc.lastEditedAt,
      carExperience: data.carExperience,
      keySpecs: data.keySpecs,
      engineeringSection: data.engineeringSection,
      buildJourneySection: data.buildJourneySection,
      visualBreakdownSection: data.visualBreakdownSection,
      openPositionsSection: data.openPositionsSection,
      footerSummary: footerRef
        ? {
            lastPublishedAt: footerRef.lastPublishedAt,
            status: footerRef.status,
          }
        : null,
    });
  } catch (err) {
    console.error('Error in getAdminCarContent:', err);
    return sendError(res, 500, 'Error loading Car CMS: ' + err.message);
  }
};

/**
 * Admin Endpoint: PATCH / PUT /api/v1/admin/car/page (and /admin/car)
 * Saves updates to draftVersion without publishing live
 */
const updateCarDraft = async (req, res) => {
  try {
    const doc = await getOrSeedCarDoc();
    const payload = req.body || {};

    // Validate payload size safety (< 500KB)
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > 500000) {
      return sendError(res, 400, 'Payload size exceeds safe limit. Please ensure images are uploaded via MediaPicker.');
    }

    const currentDraft = doc.draftVersion || doc.toObject();

    const updatedDraft = {
      ...currentDraft,
      carExperience: payload.carExperience !== undefined ? payload.carExperience : currentDraft.carExperience,
      keySpecs: payload.keySpecs !== undefined ? payload.keySpecs : currentDraft.keySpecs,
      engineeringSection: payload.engineeringSection !== undefined ? payload.engineeringSection : currentDraft.engineeringSection,
      buildJourneySection: payload.buildJourneySection !== undefined ? payload.buildJourneySection : currentDraft.buildJourneySection,
      visualBreakdownSection: payload.visualBreakdownSection !== undefined ? payload.visualBreakdownSection : currentDraft.visualBreakdownSection,
      openPositionsSection: payload.openPositionsSection !== undefined ? payload.openPositionsSection : currentDraft.openPositionsSection,
    };

    doc.draftVersion = updatedDraft;
    doc.status = 'draft';
    doc.lastEditedAt = new Date();

    await doc.save();

    return sendSuccess(res, 200, 'Car draft saved successfully.', {
      status: doc.status,
      version: doc.version,
      lastEditedAt: doc.lastEditedAt,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    console.error('Error in updateCarDraft:', err);
    return sendError(res, 500, 'Error saving Car draft: ' + err.message);
  }
};

/**
 * Admin Endpoint: POST /api/v1/admin/car/page/publish (and /admin/car/publish)
 * Promotes sanitized draftVersion to publishedVersion
 */
const publishCar = async (req, res) => {
  try {
    const doc = await getOrSeedCarDoc();

    const draft = doc.draftVersion || doc.toObject();

    doc.publishedVersion = JSON.parse(JSON.stringify(draft));
    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    // Also update root fields for consistency
    if (draft.carExperience) doc.carExperience = draft.carExperience;
    if (draft.keySpecs) doc.keySpecs = draft.keySpecs;
    if (draft.engineeringSection) doc.engineeringSection = draft.engineeringSection;
    if (draft.buildJourneySection) doc.buildJourneySection = draft.buildJourneySection;
    if (draft.visualBreakdownSection) doc.visualBreakdownSection = draft.visualBreakdownSection;
    if (draft.openPositionsSection) doc.openPositionsSection = draft.openPositionsSection;

    await doc.save();

    // Synchronize legacy CarSpec model for backward compatibility
    try {
      const heroStage = draft.carExperience?.stages?.find(s => s.stageNumber === 0) || draft.carExperience?.stages?.[0];
      await CarSpec.findOneAndUpdate(
        {},
        {
          carName: heroStage?.heading || 'Ashwa-3 Race Car',
          heroTagline: heroStage?.description || "India's most advanced Formula Student electric race car.",
          status: 'published',
          version: doc.version,
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (syncErr) {
      console.warn('Notice: Legacy CarSpec sync bypassed:', syncErr.message);
    }

    if (req.user) {
      await logActivity(
        req.user._id,
        'PUBLISH_CAR_PAGE',
        'CarPageContent',
        doc._id,
        `Car Page v${doc.version} published live by ${req.user.fullName || req.user.email}`
      ).catch(() => {});
    }

    return sendSuccess(res, 200, 'Car page published live successfully!', {
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
    });
  } catch (err) {
    console.error('Error in publishCar:', err);
    return sendError(res, 500, 'Error publishing Car page: ' + err.message);
  }
};

module.exports = {
  getOrSeedCarDoc,
  getPublicCarContent,
  getAdminCarContent,
  updateCarDraft,
  publishCar,
};
