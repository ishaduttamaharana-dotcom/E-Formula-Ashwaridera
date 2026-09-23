// ============================================================
//  models/AboutContent.js
//  Unified Singleton Model for About Page Control Center.
//  Manages all 14 About Page sections:
//    01. Hero Slide
//    02. Who We Are
//    03. Our Story
//    04. Vision & Mission
//    05. Core Values
//    06. Team Structure
//    07. Departments
//    08. Our Process
//    09. Why Formula Bharat
//    10. Workshop
//    11. Faculty & Important People Messages
//    12. Why Join Ashwa Riders (Skills)
//    13. Get Involved CTA
//    14. Page Settings & SEO
// ============================================================

const mongoose = require('mongoose');

const aboutContentSchema = new mongoose.Schema(
  {
    // Page Settings & SEO
    settings: {
      pageTitle: { type: String, default: 'Ashwa Riders — About Us' },
      seoTitle: { type: String, default: 'About Ashwa Riders — Formula Student Electric Team SVPCET' },
      seoDescription: { type: String, default: 'Learn about E-Formula Ashwa Riders, Central India’s first Formula Student Electric team from SVPCET Nagpur.' },
      ogImageUrl: { type: String, default: '' },
      canonicalUrl: { type: String, default: 'about.html' },
    },

    // 01 HERO
    hero: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'About Ashwa Riders' },
      title: { type: String, default: 'About Ashwa Riders' },
      highlightText: { type: String, default: 'Ashwa Riders' },
      subtitle: { type: String, default: 'Engineering Excellence Through Innovation' },
      description: { type: String, default: 'Ashwa Riders is the official Formula Student team of SVPCET, dedicated to designing, manufacturing, and racing Formula-style vehicles while developing future engineers through innovation, teamwork, and real-world engineering challenges.' },
      desktopImageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png' },
      mobileImageUrl: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      posterUrl: { type: String, default: '' },
      altText: { type: String, default: 'Ashwa Riders Formula Student Car' },
      overlayOpacity: { type: Number, default: 72 },
      textAlignment: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      transition: { type: String, default: 'fade' },
      duration: { type: Number, default: 700 },
    },

    // 02 WHO WE ARE
    whoWeAre: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Who We Are' },
      title: { type: String, default: 'Who We Are' },
      highlightText: { type: String, default: 'Who We Are' },
      leadParagraph: { type: String, default: 'We are E-Formula Ashwa Riders, the Formula Student Electric team of St. Vincent Pallotti College of Engineering & Technology (SVPCET), Nagpur — proudly the first Formula Student Electric team from Central India.' },
      paragraphs: [
        { type: String }
      ],
      closingStatement: { type: String, default: "At E-Formula Ashwa Riders, students don't just study engineering — they practice it." },
      imageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg' },
      mobileImageUrl: { type: String, default: '' },
      altText: { type: String, default: 'E-Formula Ashwa Riders team' },
      imagePosition: { type: String, enum: ['left', 'right'], default: 'left' },
    },

    // 03 OUR STORY
    story: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Our Story' },
      title: { type: String, default: 'Every Great Race Begins With an Idea' },
      highlightText: { type: String, default: 'With an Idea' },
      description: { type: String, default: 'E-Formula Ashwa Riders was founded in 2020 at SVPCET, Nagpur, with a mission to unite Formula enthusiasts from diverse engineering backgrounds and build Central India’s first Formula Student Electric race car.' },
      blocks: [
        {
          id: { type: String },
          content: { type: String },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 04 VISION & MISSION
    visionMission: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Vision & Mission' },
      title: { type: String, default: "Where We're Headed" },
      highlightText: { type: String, default: 'Headed' },
      description: { type: String, default: 'Our north star and the path we walk every day.' },
      vision: {
        title: { type: String, default: 'Our Vision' },
        description: { type: String, default: 'To be Central India’s leading Formula Student Electric team by continuously innovating in EV powertrain engineering, competing nationally at Formula Bharat, and inspiring the next generation of electric-mobility engineers.' },
        icon: { type: String, default: 'fas fa-eye' },
      },
      mission: {
        title: { type: String, default: 'Our Mission' },
        description: { type: String, default: 'We design, build, and race a competitive Formula Student Electric vehicle while advancing engineering education and sustainable mobility.' },
        icon: { type: String, default: 'fas fa-bullseye' },
        bullets: [{ type: String }],
      },
    },

    // 05 CORE VALUES
    coreValues: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Core Values' },
      title: { type: String, default: 'What We Stand For' },
      highlightText: { type: String, default: 'Stand For' },
      description: { type: String, default: 'Discover the principles that drive us.' },
      items: [
        {
          id: { type: String },
          title: { type: String, required: true },
          description: { type: String, required: true },
          detailedDescription: { type: String, default: '' },
          icon: { type: String, default: 'fas fa-lightbulb' },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 06 TEAM STRUCTURE
    teamStructure: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Team Structure' },
      title: { type: String, default: "How We're Organized" },
      highlightText: { type: String, default: 'Organized' },
      description: { type: String, default: 'Click any level to view its members.' },
      nodes: [
        {
          id: { type: String },
          title: { type: String, required: true },
          memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
          memberName: { type: String, default: '' },
          linkUrl: { type: String, default: 'team.html' },
          level: { type: Number, default: 1 },
          description: { type: String, default: '' },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 07 DEPARTMENTS
    departments: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Departments' },
      title: { type: String, default: 'Eleven Departments. One Machine.' },
      highlightText: { type: String, default: 'One Machine.' },
      description: { type: String, default: "Every discipline reports to the same lap-time target. Here's who builds what." },
      items: [
        {
          id: { type: String },
          name: { type: String, required: true },
          icon: { type: String, default: 'fas fa-cogs' },
          teamLead: { type: String, default: 'Team Lead' },
          description: { type: String, default: '' },
          responsibilities: [{ type: String }],
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 08 OUR PROCESS
    process: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Our Process' },
      title: { type: String, default: 'How We Build a Formula Car' },
      highlightText: { type: String, default: 'Formula Car' },
      description: { type: String, default: 'Click a stage to see what it involves.' },
      stages: [
        {
          id: { type: String },
          stepNumber: { type: String, default: '01' },
          name: { type: String, required: true },
          description: { type: String, default: '' },
          details: { type: String, default: '' },
          imageUrl: { type: String, default: '' },
          videoUrl: { type: String, default: '' },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 09 FORMULA BHARAT
    formulaBharat: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Why Formula Bharat?' },
      title: { type: String, default: 'Formula Bharat' },
      highlightText: { type: String, default: 'Bharat' },
      description: { type: String, default: "Formula Bharat is India's premier Formula Student competition, held annually at the Kari Motor Speedway in Coimbatore..." },
      imageUrl: { type: String, default: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784445596/WhatsApp_Image_2026-07-19_at_11.46.38_AM_1_b6kp8z.jpg' },
      videoUrl: { type: String, default: '' },
      altText: { type: String, default: 'E-Formula Ashwa Riders at Formula Bharat' },
      facts: [
        {
          id: { type: String },
          label: { type: String, required: true },
          url: { type: String, default: '' },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 10 WORKSHOP
    workshop: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Workshop' },
      title: { type: String, default: 'Where It All Comes Together' },
      highlightText: { type: String, default: 'Comes Together' },
      description: { type: String, default: 'Inside our dedicated fabrication and assembly facility.' },
      items: [
        {
          id: { type: String },
          title: { type: String, required: true },
          icon: { type: String, default: 'fas fa-tools' },
          imageUrl: { type: String, default: '' },
          videoUrl: { type: String, default: '' },
          description: { type: String, default: '' },
          linkUrl: { type: String, default: '' },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 11 FACULTY & PEOPLE MESSAGES
    peopleMessages: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Faculty & Leadership' },
      title: { type: String, default: 'Words From Our Guidance & Leadership' },
      description: { type: String, default: 'Insights from faculty advisors and team leaders.' },
      messages: [
        {
          id: { type: String },
          personType: { type: String, default: 'Faculty Coordinator' },
          name: { type: String, required: true },
          role: { type: String, default: '' },
          photoUrl: { type: String, default: '' },
          quote: { type: String, default: '' },
          description: { type: String, default: '' },
          linkedinUrl: { type: String, default: '' },
          memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamMember', default: null },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 12 WHY JOIN ASHWA RIDERS (SKILLS)
    whyJoin: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Why Join Ashwa Riders' },
      title: { type: String, default: "Skills You'll Actually Use" },
      highlightText: { type: String, default: 'Use' },
      description: { type: String, default: 'Members learn far beyond the classroom syllabus.' },
      skills: [
        {
          id: { type: String },
          name: { type: String, required: true },
          description: { type: String, default: '' },
          icon: { type: String, default: 'fas fa-check-circle' },
          order: { type: Number, default: 0 },
          visible: { type: Boolean, default: true },
        },
      ],
    },

    // 13 GET INVOLVED CTA
    cta: {
      visible: { type: Boolean, default: true },
      eyebrow: { type: String, default: 'Get Involved' },
      title: { type: String, default: 'Ready to Race With Us?' },
      highlightText: { type: String, default: 'Race' },
      description: { type: String, default: 'Join a team of passionate engineers and innovators, or help power our next season as a sponsor.' },
      primaryBtnText: { type: String, default: 'Become a Team Member' },
      primaryBtnUrl: { type: String, default: 'index.html#recruitment' },
      primaryBtnVisible: { type: Boolean, default: true },
      secondaryBtnText: { type: String, default: 'Become a Sponsor' },
      secondaryBtnUrl: { type: String, default: 'sponsors.html' },
      secondaryBtnVisible: { type: Boolean, default: true },
      backgroundStyle: { type: String, default: 'dark' },
    },

    // Lifecycle & Publishing fields
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
    lastPublishedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    collection: 'about_content',
    timestamps: true,
    versionKey: false,
    strict: false,
  }
);

const AboutContent = mongoose.model('AboutContent', aboutContentSchema);

module.exports = AboutContent;
