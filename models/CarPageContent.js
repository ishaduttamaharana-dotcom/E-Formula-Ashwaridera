// ============================================================
//  models/CarPageContent.js
//  Singleton schema for Ashwa-3 Car Page Control Center.
//  Sections:
//    01. Car Experience (5 Stages: 00 HERO to 04 FINAL)
//    02. Vehicle Values / Key Specifications (4 Spec Blocks)
//    03. Engineering Systems (Tabs: Chassis, Suspension, Aero, etc.)
//    04. The Build Journey (Horizontal Timeline Phases)
//    05. Visual Breakdown (In the Details Masonry Grid)
//    06. Open Positions (Recruitment CTA Section)
//  Draft / Preview / Publish lifecycle with lightweight JSON only.
// ============================================================

const mongoose = require('mongoose');

// Stage Stat item (e.g. Peak Power: 120 kW)
const stageStatSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, default: '', trim: true },
  },
  { _id: false }
);

// Stage Item (00 HERO, 01 REVEAL, etc.)
const stageItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    stageNumber: { type: Number, required: true },
    stageName: { type: String, required: true, trim: true },
    eyebrow: { type: String, default: '', trim: true },
    heading: { type: String, required: true, trim: true },
    headingHighlight: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    mediaUrl: { type: String, default: '', trim: true },
    frameNumber: { type: String, default: '001', trim: true },
    minScroll: { type: Number, default: 0.0 },
    maxScroll: { type: Number, default: 0.2 },
    stats: [stageStatSchema],
    primaryCta: {
      text: { type: String, default: '', trim: true },
      link: { type: String, default: '', trim: true },
      enabled: { type: Boolean, default: false },
    },
    secondaryCta: {
      text: { type: String, default: '', trim: true },
      link: { type: String, default: '', trim: true },
      enabled: { type: Boolean, default: false },
    },
    order: { type: Number, default: 1 },
    published: { type: Boolean, default: true },
  },
  { _id: false }
);

// Vehicle Key Spec item (4-strip)
const keySpecSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    highlight: { type: Boolean, default: false },
    order: { type: Number, default: 1 },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

// Engineering Card Spec Row
const cardSpecRowSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

// Engineering Card
const engineeringCardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: 'fas fa-cubes', trim: true },
    isFullWidth: { type: Boolean, default: false },
    specs: [cardSpecRowSchema],
    order: { type: Number, default: 1 },
  },
  { _id: false }
);

// Engineering Category (Tab)
const engineeringCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'fas fa-cubes', trim: true },
    order: { type: Number, default: 1 },
    visible: { type: Boolean, default: true },
    cards: [engineeringCardSchema],
  },
  { _id: false }
);

// Build Journey Phase item
const buildPhaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    phaseNumber: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    icon: { type: String, default: 'fas fa-pencil-ruler', trim: true },
    dateTag: { type: String, default: '', trim: true },
    isDone: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

// Visual Breakdown Card item
const visualCardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '', trim: true },
    altText: { type: String, default: '', trim: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 1 },
    visible: { type: Boolean, default: true },
  },
  { _id: false }
);

// Main Car Page Content Schema
const carPageContentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastPublishedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },

    // 01. CAR EXPERIENCE (SCROLLING VIEWPORT & STAGES)
    carExperience: {
      visible: { type: Boolean, default: true },
      totalFrames: { type: Number, default: 240 },
      framePattern: {
        type: String,
        default: 'assets/videotophoto/ezgif-frame-{num}.jpg',
        trim: true,
      },
      stages: [stageItemSchema],
    },

    // 02. VEHICLE VALUES / KEY SPECIFICATIONS
    keySpecs: [keySpecSchema],

    // 03. ENGINEERING SYSTEMS
    engineeringSection: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Engineering Systems', trim: true },
      heading: { type: String, default: 'Built for Performance', trim: true },
      headingHighlight: { type: String, default: 'Performance', trim: true },
      description: {
        type: String,
        default: 'Every vehicle subsystem is engineered to operate in total harmony at race speed.',
        trim: true,
      },
      watermarkText: { type: String, default: 'TECH', trim: true },
      categories: [engineeringCategorySchema],
    },

    // 04. THE BUILD JOURNEY
    buildJourneySection: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'From Concept to Circuit', trim: true },
      heading: { type: String, default: 'The Build Journey', trim: true },
      headingHighlight: { type: String, default: 'Journey', trim: true },
      description: {
        type: String,
        default: 'Ashwa-3 was designed, fabricated, and tested entirely by our student engineering team over 14 months.',
        trim: true,
      },
      phases: [buildPhaseSchema],
    },

    // 05. VISUAL BREAKDOWN
    visualBreakdownSection: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Visual Breakdown', trim: true },
      heading: { type: String, default: 'In the Details', trim: true },
      headingHighlight: { type: String, default: 'Details', trim: true },
      description: {
        type: String,
        default: 'A closer look at Ashwa-3\'s high-performance precision craftsmanship and engineering systems.',
        trim: true,
      },
      cards: [visualCardSchema],
    },

    // 06. OPEN POSITIONS (RECRUITMENT CTA)
    openPositionsSection: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Open Positions', trim: true },
      heading: { type: String, default: 'Want to Build the Next Machine?', trim: true },
      headingHighlight: { type: String, default: 'Next Machine?', trim: true },
      description: {
        type: String,
        default: 'Join our team of engineers and help design, build, and race the next generation of Ashwa Formula cars.',
        trim: true,
      },
      primaryCta: {
        text: { type: String, default: 'Join the Team', trim: true },
        link: { type: String, default: 'index.html#recruitment', trim: true },
        enabled: { type: Boolean, default: true },
      },
      secondaryCta: {
        text: { type: String, default: 'Get in Touch', trim: true },
        link: { type: String, default: 'contact.html', trim: true },
        enabled: { type: Boolean, default: true },
      },
    },

    draftVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    publishedVersion: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    collection: 'car_page_contents',
    timestamps: true,
    versionKey: false,
  }
);

const CarPageContent = mongoose.model('CarPageContent', carPageContentSchema);

module.exports = CarPageContent;
