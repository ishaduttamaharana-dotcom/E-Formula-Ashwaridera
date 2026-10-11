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
  if (doc) {
    let modified = false;

    // Auto-heal empty arrays from canonical defaults
    if (!doc.carExperience || !Array.isArray(doc.carExperience.stages) || doc.carExperience.stages.length === 0) {
      doc.carExperience = {
        visible: true,
        totalFrames: 240,
        framePattern: 'assets/videotophoto/ezgif-frame-{num}.jpg',
        stages: DEFAULT_STAGES,
      };
      modified = true;
    }

    if (!Array.isArray(doc.keySpecs) || doc.keySpecs.length === 0) {
      doc.keySpecs = DEFAULT_KEY_SPECS;
      modified = true;
    }

    if (!doc.engineeringSection || !Array.isArray(doc.engineeringSection.categories) || doc.engineeringSection.categories.length === 0) {
      doc.engineeringSection = {
        visible: true,
        eyebrow: 'Engineering Systems',
        heading: 'Built for Performance',
        headingHighlight: 'Performance',
        description: 'Every vehicle subsystem is engineered to operate in total harmony at race speed.',
        watermarkText: 'TECH',
        categories: DEFAULT_ENGINEERING_CATEGORIES,
      };
      modified = true;
    }

    if (!doc.buildJourneySection || !Array.isArray(doc.buildJourneySection.phases) || doc.buildJourneySection.phases.length === 0) {
      doc.buildJourneySection = {
        visible: true,
        eyebrow: 'From Concept to Circuit',
        heading: 'The Build Journey',
        headingHighlight: 'Journey',
        description: 'Ashwa-3 was designed, fabricated, and tested entirely by our student engineering team over 14 months.',
        phases: DEFAULT_BUILD_PHASES,
      };
      modified = true;
    }

    if (!doc.visualBreakdownSection || !Array.isArray(doc.visualBreakdownSection.cards) || doc.visualBreakdownSection.cards.length === 0) {
      doc.visualBreakdownSection = {
        visible: true,
        eyebrow: 'Visual Breakdown',
        heading: 'In the Details',
        headingHighlight: 'Details',
        description: 'A closer look at Ashwa-3\'s high-performance precision craftsmanship and engineering systems.',
        cards: DEFAULT_VISUAL_CARDS,
      };
      modified = true;
    }

    if (!doc.openPositionsSection || !doc.openPositionsSection.heading) {
      doc.openPositionsSection = {
        visible: true,
        eyebrow: 'Open Positions',
        heading: 'Want to Build the Next Machine?',
        headingHighlight: 'Next Machine?',
        description: 'Join our team of engineers and help design, build, and race the next generation of Ashwa Formula cars.',
        primaryCta: { text: 'Join the Team', link: 'index.html#recruitment', enabled: true },
        secondaryCta: { text: 'Get in Touch', link: 'contact.html', enabled: true },
      };
      modified = true;
    }

    // Auto-repair legacy documents where specs have key but missing label
    const repairSpecs = (categories) => {
      if (!Array.isArray(categories)) return;
      categories.forEach((cat) => {
        if (!cat.name && cat.title) cat.name = cat.title;
        (cat.cards || []).forEach((card) => {
          (card.specs || []).forEach((spec) => {
            if (!spec.label && spec.key) {
              spec.label = String(spec.key).trim();
              modified = true;
            }
            if (spec.label && !spec.key) {
              spec.key = spec.label;
            }
          });
        });
      });
    };

    const repairKeySpecs = (specs) => {
      if (!Array.isArray(specs)) return;
      specs.forEach((spec) => {
        if (!spec.label && spec.key) {
          spec.label = String(spec.key).trim();
          modified = true;
        }
        if (spec.label && !spec.key) {
          spec.key = spec.label;
        }
      });
    };

    repairSpecs(doc.engineeringSection?.categories);
    repairSpecs(doc.draftVersion?.engineeringSection?.categories);
    repairSpecs(doc.publishedVersion?.engineeringSection?.categories);

    repairKeySpecs(doc.keySpecs);
    repairKeySpecs(doc.draftVersion?.keySpecs);
    repairKeySpecs(doc.publishedVersion?.keySpecs);

    // Ensure draftVersion and publishedVersion are not empty
    const healVersionCopy = (ver) => {
      if (!ver) return null;
      let healed = false;
      const copy = { ...ver };
      if (!copy.carExperience || !Array.isArray(copy.carExperience.stages) || copy.carExperience.stages.length === 0) {
        copy.carExperience = doc.carExperience;
        healed = true;
      }
      if (!Array.isArray(copy.keySpecs) || copy.keySpecs.length === 0) {
        copy.keySpecs = doc.keySpecs;
        healed = true;
      }
      if (!copy.engineeringSection || !Array.isArray(copy.engineeringSection.categories) || copy.engineeringSection.categories.length === 0) {
        copy.engineeringSection = doc.engineeringSection;
        healed = true;
      }
      if (!copy.buildJourneySection || !Array.isArray(copy.buildJourneySection.phases) || copy.buildJourneySection.phases.length === 0) {
        copy.buildJourneySection = doc.buildJourneySection;
        healed = true;
      }
      if (!copy.visualBreakdownSection || !Array.isArray(copy.visualBreakdownSection.cards) || copy.visualBreakdownSection.cards.length === 0) {
        copy.visualBreakdownSection = doc.visualBreakdownSection;
        healed = true;
      }
      if (!copy.openPositionsSection || !copy.openPositionsSection.heading) {
        copy.openPositionsSection = doc.openPositionsSection;
        healed = true;
      }
      return healed ? copy : ver;
    };

    const healedDraft = healVersionCopy(doc.draftVersion);
    if (healedDraft !== doc.draftVersion) {
      doc.draftVersion = healedDraft;
      modified = true;
    }

    const healedPub = healVersionCopy(doc.publishedVersion);
    if (healedPub !== doc.publishedVersion) {
      doc.publishedVersion = healedPub;
      modified = true;
    }

    if (modified) {
      doc.markModified('carExperience');
      doc.markModified('engineeringSection');
      doc.markModified('buildJourneySection');
      doc.markModified('visualBreakdownSection');
      doc.markModified('openPositionsSection');
      doc.markModified('draftVersion');
      doc.markModified('publishedVersion');
      doc.markModified('keySpecs');
      await doc.save().catch((err) => console.warn('CarPageContent auto-repair warning:', err.message));
    }
    return doc;
  }

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

    // Filter visible stages (with canonical fallback)
    let visibleStages = (content.carExperience?.stages || [])
      .filter((s) => isPreview || s.published !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!visibleStages.length) visibleStages = DEFAULT_STAGES;

    // Filter visible key specs (with canonical fallback)
    let visibleKeySpecs = (content.keySpecs || [])
      .filter((s) => isPreview || s.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!visibleKeySpecs.length) visibleKeySpecs = DEFAULT_KEY_SPECS;

    // Filter visible engineering categories and cards (with canonical fallback)
    let rawCategories = (content.engineeringSection?.categories || [])
      .filter((cat) => isPreview || cat.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((cat) => ({
        ...cat,
        cards: (cat.cards || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));
    if (!rawCategories.length) rawCategories = DEFAULT_ENGINEERING_CATEGORIES;

    const visibleEngineering = {
      ...(content.engineeringSection || {}),
      eyebrow: content.engineeringSection?.eyebrow || 'Engineering Systems',
      heading: content.engineeringSection?.heading || 'Built for Performance',
      headingHighlight: content.engineeringSection?.headingHighlight || 'Performance',
      description: content.engineeringSection?.description || 'Every vehicle subsystem is engineered to operate in total harmony at race speed.',
      watermarkText: content.engineeringSection?.watermarkText || 'TECH',
      categories: rawCategories,
    };

    // Filter visible build journey phases (with canonical fallback)
    let visibleBuildPhases = (content.buildJourneySection?.phases || [])
      .filter((p) => isPreview || p.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!visibleBuildPhases.length) visibleBuildPhases = DEFAULT_BUILD_PHASES;

    // Filter visible visual breakdown cards (with canonical fallback)
    let visibleVisualCards = (content.visualBreakdownSection?.cards || [])
      .filter((v) => isPreview || v.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    if (!visibleVisualCards.length) visibleVisualCards = DEFAULT_VISUAL_CARDS;

    const resolvedOpenPositions = (content.openPositionsSection && content.openPositionsSection.heading)
      ? content.openPositionsSection
      : {
          visible: true,
          eyebrow: 'Open Positions',
          heading: 'Want to Build the Next Machine?',
          headingHighlight: 'Next Machine?',
          description: 'Join our team of engineers and help design, build, and race the next generation of Ashwa Formula cars.',
          primaryCta: { text: 'Join the Team', link: 'index.html#recruitment', enabled: true },
          secondaryCta: { text: 'Get in Touch', link: 'contact.html', enabled: true },
        };

    return sendSuccess(res, 200, 'Car page content retrieved.', {
      isPreview,
      status: doc.status,
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      carExperience: {
        ...(content.carExperience || {}),
        stages: visibleStages,
      },
      keySpecs: visibleKeySpecs,
      engineeringSection: visibleEngineering,
      buildJourneySection: {
        ...(content.buildJourneySection || {}),
        eyebrow: content.buildJourneySection?.eyebrow || 'From Concept to Circuit',
        heading: content.buildJourneySection?.heading || 'The Build Journey',
        headingHighlight: content.buildJourneySection?.headingHighlight || 'Journey',
        description: content.buildJourneySection?.description || 'Ashwa-3 was designed, fabricated, and tested entirely by our student engineering team over 14 months.',
        phases: visibleBuildPhases,
      },
      visualBreakdownSection: {
        ...(content.visualBreakdownSection || {}),
        eyebrow: content.visualBreakdownSection?.eyebrow || 'Visual Breakdown',
        heading: content.visualBreakdownSection?.heading || 'In the Details',
        headingHighlight: content.visualBreakdownSection?.headingHighlight || 'Details',
        description: content.visualBreakdownSection?.description || 'A closer look at Ashwa-3\'s high-performance precision craftsmanship and engineering systems.',
        cards: visibleVisualCards,
      },
      openPositionsSection: resolvedOpenPositions,
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
 * Normalizes engineering categories and card specs so label & value are always trimmed strings,
 * and key is maintained as an alias for label.
 */
const normalizeEngineeringCategories = (categories) => {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat, catIdx) => {
    const catName = (cat.name || cat.title || `Category ${catIdx + 1}`).trim();
    const cards = (cat.cards || []).map((card, cardIdx) => {
      const specs = (card.specs || [])
        .map((s) => {
          const l = (s.label || s.key || '').trim();
          const v = (s.value !== undefined && s.value !== null ? String(s.value) : '').trim();
          return { label: l, value: v, key: l };
        })
        .filter((s) => s.label.length > 0 || s.value.length > 0);
      return {
        ...card,
        specs,
        order: card.order || cardIdx + 1,
      };
    });
    return {
      ...cat,
      name: catName,
      title: catName,
      cards,
      order: cat.order || catIdx + 1,
    };
  });
};

/**
 * Normalizes key specifications strip so label & value are always trimmed strings.
 */
const normalizeKeySpecs = (specs) => {
  if (!Array.isArray(specs)) return [];
  return specs.map((s, idx) => {
    const l = (s.label || s.key || '').trim();
    const v = (s.value !== undefined && s.value !== null ? String(s.value) : '').trim();
    return {
      ...s,
      label: l,
      key: l,
      value: v,
      order: s.order || idx + 1,
    };
  });
};

/**
 * Validates engineering categories and card specs prior to publishing live.
 * Throws a human-readable Error identifying the exact category, card, and spec.
 */
const validateEngineeringForPublish = (engineeringSection) => {
  const categories = engineeringSection?.categories || [];
  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const cat = categories[catIdx];
    const catName = cat.name || cat.title || `Category #${catIdx + 1}`;
    const cards = cat.cards || [];
    for (let cardIdx = 0; cardIdx < cards.length; cardIdx++) {
      const card = cards[cardIdx];
      const cardTitle = card.title || `Card #${cardIdx + 1}`;
      const specs = card.specs || [];
      for (let sIdx = 0; sIdx < specs.length; sIdx++) {
        const spec = specs[sIdx];
        const label = (spec.label || spec.key || '').trim();
        const value = (spec.value !== undefined && spec.value !== null ? String(spec.value) : '').trim();
        if (!label) {
          throw new Error(
            `Engineering Category "${catName}" → Card "${cardTitle}" → Specification #${sIdx + 1} is missing a required label.`
          );
        }
        if (!value) {
          throw new Error(
            `Engineering Category "${catName}" → Card "${cardTitle}" → Specification "${label}" is missing a required value.`
          );
        }
      }
    }
  }
};

/**
 * Validates key specifications strip prior to publishing live.
 */
const validateKeySpecsForPublish = (keySpecs) => {
  const specs = keySpecs || [];
  for (let sIdx = 0; sIdx < specs.length; sIdx++) {
    const spec = specs[sIdx];
    const label = (spec.label || spec.key || '').trim();
    const value = (spec.value !== undefined && spec.value !== null ? String(spec.value) : '').trim();
    if (!label) {
      throw new Error(`Vehicle Key Spec #${sIdx + 1} is missing a required label.`);
    }
    if (!value) {
      throw new Error(`Vehicle Key Spec "${label}" is missing a required value.`);
    }
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

    // Preserve non-empty engineering categories if partial update is provided
    let normalizedEngineering = currentDraft.engineeringSection;
    if (payload.engineeringSection !== undefined) {
      const incomingCats = payload.engineeringSection?.categories;
      const categoriesToUse = (Array.isArray(incomingCats) && incomingCats.length > 0)
        ? incomingCats
        : (currentDraft.engineeringSection?.categories || DEFAULT_ENGINEERING_CATEGORIES);

      normalizedEngineering = {
        ...currentDraft.engineeringSection,
        ...payload.engineeringSection,
        categories: normalizeEngineeringCategories(categoriesToUse),
      };
    }

    // Preserve non-empty key specs if partial update is provided
    let normalizedKeySpecs = currentDraft.keySpecs;
    if (payload.keySpecs !== undefined) {
      const incomingSpecs = payload.keySpecs;
      const specsToUse = (Array.isArray(incomingSpecs) && incomingSpecs.length > 0)
        ? incomingSpecs
        : (currentDraft.keySpecs || DEFAULT_KEY_SPECS);
      normalizedKeySpecs = normalizeKeySpecs(specsToUse);
    }

    // Preserve carExperience stages
    let updatedCarExp = currentDraft.carExperience;
    if (payload.carExperience !== undefined) {
      const incomingStages = payload.carExperience?.stages;
      const stagesToUse = (Array.isArray(incomingStages) && incomingStages.length > 0)
        ? incomingStages
        : (currentDraft.carExperience?.stages || DEFAULT_STAGES);
      updatedCarExp = {
        ...currentDraft.carExperience,
        ...payload.carExperience,
        stages: stagesToUse,
      };
    }

    // Preserve buildJourney phases
    let updatedBuild = currentDraft.buildJourneySection;
    if (payload.buildJourneySection !== undefined) {
      const incomingPhases = payload.buildJourneySection?.phases;
      const phasesToUse = (Array.isArray(incomingPhases) && incomingPhases.length > 0)
        ? incomingPhases
        : (currentDraft.buildJourneySection?.phases || DEFAULT_BUILD_PHASES);
      updatedBuild = {
        ...currentDraft.buildJourneySection,
        ...payload.buildJourneySection,
        phases: phasesToUse,
      };
    }

    // Preserve visualBreakdown cards
    let updatedVisual = currentDraft.visualBreakdownSection;
    if (payload.visualBreakdownSection !== undefined) {
      const incomingCards = payload.visualBreakdownSection?.cards;
      const cardsToUse = (Array.isArray(incomingCards) && incomingCards.length > 0)
        ? incomingCards
        : (currentDraft.visualBreakdownSection?.cards || DEFAULT_VISUAL_CARDS);
      updatedVisual = {
        ...currentDraft.visualBreakdownSection,
        ...payload.visualBreakdownSection,
        cards: cardsToUse,
      };
    }

    const updatedDraft = {
      ...currentDraft,
      carExperience: updatedCarExp,
      keySpecs: normalizedKeySpecs,
      engineeringSection: normalizedEngineering,
      buildJourneySection: updatedBuild,
      visualBreakdownSection: updatedVisual,
      openPositionsSection: payload.openPositionsSection !== undefined ? payload.openPositionsSection : currentDraft.openPositionsSection,
    };

    doc.draftVersion = updatedDraft;
    doc.markModified('draftVersion');
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

    // Ensure no section is empty before publishing live
    if (!draft.carExperience?.stages?.length) {
      draft.carExperience = { ...(draft.carExperience || {}), stages: DEFAULT_STAGES };
    }
    if (!draft.keySpecs?.length) {
      draft.keySpecs = DEFAULT_KEY_SPECS;
    }
    if (!draft.engineeringSection?.categories?.length) {
      draft.engineeringSection = { ...(draft.engineeringSection || {}), categories: DEFAULT_ENGINEERING_CATEGORIES };
    }
    if (!draft.buildJourneySection?.phases?.length) {
      draft.buildJourneySection = { ...(draft.buildJourneySection || {}), phases: DEFAULT_BUILD_PHASES };
    }
    if (!draft.visualBreakdownSection?.cards?.length) {
      draft.visualBreakdownSection = { ...(draft.visualBreakdownSection || {}), cards: DEFAULT_VISUAL_CARDS };
    }
    if (!draft.openPositionsSection || !draft.openPositionsSection.heading) {
      draft.openPositionsSection = {
        visible: true,
        eyebrow: 'Open Positions',
        heading: 'Want to Build the Next Machine?',
        headingHighlight: 'Next Machine?',
        description: 'Join our team of engineers and help design, build, and race the next generation of Ashwa Formula cars.',
        primaryCta: { text: 'Join the Team', link: 'index.html#recruitment', enabled: true },
        secondaryCta: { text: 'Get in Touch', link: 'contact.html', enabled: true },
      };
    }

    // Pre-validate before promoting to live
    validateEngineeringForPublish(draft.engineeringSection);
    validateKeySpecsForPublish(draft.keySpecs);

    // Normalize before saving to root strictly-typed Mongoose schema
    const normalizedEngineering = draft.engineeringSection
      ? {
          ...draft.engineeringSection,
          categories: normalizeEngineeringCategories(draft.engineeringSection.categories),
        }
      : doc.engineeringSection;

    const normalizedKey = draft.keySpecs ? normalizeKeySpecs(draft.keySpecs) : doc.keySpecs;

    const publishedCopy = JSON.parse(JSON.stringify(draft));
    publishedCopy.engineeringSection = normalizedEngineering;
    publishedCopy.keySpecs = normalizedKey;

    doc.publishedVersion = publishedCopy;
    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    // Also update root fields for consistency
    if (draft.carExperience) doc.carExperience = draft.carExperience;
    doc.keySpecs = normalizedKey;
    doc.engineeringSection = normalizedEngineering;
    if (draft.buildJourneySection) doc.buildJourneySection = draft.buildJourneySection;
    if (draft.visualBreakdownSection) doc.visualBreakdownSection = draft.visualBreakdownSection;
    if (draft.openPositionsSection) doc.openPositionsSection = draft.openPositionsSection;

    doc.markModified('publishedVersion');
    doc.markModified('engineeringSection');
    doc.markModified('keySpecs');

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
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors || {})
        .map((e) => e.message)
        .join('; ');
      return sendError(res, 400, `Car validation failed: ${messages || err.message}`);
    }
    return sendError(res, 400, err.message || 'Error publishing Car page');
  }
};

module.exports = {
  getOrSeedCarDoc,
  getPublicCarContent,
  getAdminCarContent,
  updateCarDraft,
  publishCar,
};
