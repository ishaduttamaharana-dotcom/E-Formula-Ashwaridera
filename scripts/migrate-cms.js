// ============================================================
//  scripts/migrate-cms.js
//  Reversible & Idempotent Migration Tool for Ashwa Riders CMS.
//
//  Usage:
//    node scripts/migrate-cms.js --dry-run
//    node scripts/migrate-cms.js --execute
// ============================================================

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

// Models
const HeroSlide = require('../models/HeroSlide');
const BuildStage = require('../models/BuildStage');
const NewsArticle = require('../models/NewsArticle');
const HomeStat = require('../models/HomeStat');
const TeamMember = require('../models/TeamMember');
const Achievement = require('../models/Achievement');
const GalleryAlbum = require('../models/GalleryAlbum');
const GalleryImage = require('../models/GalleryImage');
const Sponsor = require('../models/Sponsor');
const SponsorPackage = require('../models/SponsorPackage');
const AboutContent = require('../models/AboutContent');
const CarSpec = require('../models/CarSpec');
const ContactInfo = require('../models/ContactInfo');
const NavFooterSettings = require('../models/NavFooterSettings');
const SiteSeoSettings = require('../models/SiteSeoSettings');
const CmsContent = require('../models/CmsContent');
const GarageCard = require('../models/GarageCard');
const HomeHero = require('../models/HomeHero');

const { buildSnapshot } = require('../utils/publishingHelper');

const runMigration = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════');
  console.log(`🚀  Ashwa Riders CMS Migration Tool`);
  console.log(`🌍  Mode: ${isDryRun ? 'DRY RUN (No database writes)' : 'EXECUTE (Writing changes to MongoDB)'}`);
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.connect(uri);

  let updatedCount = 0;
  let seededCount = 0;

  // 1. Upgrade existing Hero records to HeroSlide or seed default
  const heroCount = await HeroSlide.countDocuments();
  if (heroCount === 0) {
    const oldHeroes = await HomeHero.find();
    if (oldHeroes.length > 0) {
      for (const h of oldHeroes) {
        seededCount++;
        if (!isDryRun) {
          const slide = new HeroSlide({
            heading: h.heading || 'ASHWA RIDERS',
            subtitle: h.subtitle || 'Engineering Speed. Building Innovation. Racing the Future.',
            badgeText: h.badgeText || 'Ashwa Riders — 2026 Season',
            videoUrl: h.videoUrl || '',
            primaryBtnText: h.primaryBtnText || 'Explore Our Car',
            primaryBtnLink: h.primaryBtnLink || 'car.html',
            secondaryBtnText: h.secondaryBtnText || 'Become a Sponsor',
            secondaryBtnLink: h.secondaryBtnLink || 'sponsors.html',
            status: 'published',
            order: 1,
          });
          slide.publishedVersion = buildSnapshot(slide.toObject());
          await slide.save();
        }
      }
    } else {
      seededCount++;
      if (!isDryRun) {
        const slide = new HeroSlide({
          heading: 'ASHWA RIDERS',
          subtitle: 'Engineering Speed. Building Innovation. Racing the Future.',
          badgeText: 'Ashwa Riders — 2026 Season',
          videoUrl: '',
          primaryBtnText: 'Explore Our Car',
          primaryBtnLink: 'car.html',
          secondaryBtnText: 'Become a Sponsor',
          secondaryBtnLink: 'sponsors.html',
          status: 'published',
          order: 1,
        });
        slide.publishedVersion = buildSnapshot(slide.toObject());
        await slide.save();
      }
    }
  }

  // 2. Consolidate GarageCard and CmsContent (garage-to-grid) into BuildStage
  const garageCards = await GarageCard.find();
  for (const gc of garageCards) {
    const exists = await BuildStage.findOne({ title: gc.title });
    if (!exists) {
      seededCount++;
      if (!isDryRun) {
        const bs = new BuildStage({
          title: gc.title,
          description: gc.description,
          imageUrl: gc.imageUrl,
          publicId: gc.publicId,
          order: gc.order || 0,
          status: 'published',
        });
        bs.publishedVersion = buildSnapshot(bs.toObject());
        await bs.save();
      }
    }
  }

  // 3. Ensure existing TeamMember records have published status & snapshots
  const teamMembers = await TeamMember.find();
  for (const tm of teamMembers) {
    if (!tm.status || !tm.publishedVersion) {
      updatedCount++;
      if (!isDryRun) {
        tm.status = 'published';
        tm.publishedVersion = buildSnapshot(tm.toObject());
        await tm.save();
      }
    }
  }

  // 4. Ensure existing Achievements have published status & snapshots
  const achievements = await Achievement.find();
  for (const ach of achievements) {
    if (!ach.status || !ach.publishedVersion) {
      updatedCount++;
      if (!isDryRun) {
        ach.status = 'published';
        ach.publishedVersion = buildSnapshot(ach.toObject());
        await ach.save();
      }
    }
  }

  // 5. Seed AboutContent if empty
  const aboutCount = await AboutContent.countDocuments();
  if (aboutCount === 0) {
    seededCount++;
    if (!isDryRun) {
      const about = new AboutContent({
        status: 'published',
      });
      about.publishedVersion = buildSnapshot(about.toObject());
      await about.save();
    }
  }

  // 6. Seed CarSpec if empty
  const carCount = await CarSpec.countDocuments();
  if (carCount === 0) {
    seededCount++;
    if (!isDryRun) {
      const car = new CarSpec({
        carName: 'Tarkshya EV',
        season: '2026 Season',
        heroTagline: 'Central India’s First Electric Formula Student Race Car',
        specGroups: [
          {
            groupName: 'Powertrain & Performance',
            rows: [
              { label: 'Peak Power', value: '80', unit: 'kW' },
              { label: 'Top Speed', value: '115', unit: 'km/h' },
              { label: '0-100 km/h', value: '3.8', unit: 'sec' },
            ],
          },
          {
            groupName: 'Chassis & Suspension',
            rows: [
              { label: 'Frame', value: 'Steel Tubular Spaceframe', unit: '' },
              { label: 'Suspension', value: 'Double Wishbone Pushrod', unit: '' },
              { label: 'Weight', value: '230', unit: 'kg' },
            ],
          },
        ],
        status: 'published',
      });
      car.publishedVersion = buildSnapshot(car.toObject());
      await car.save();
    }
  }

  // 7. Seed NavFooterSettings if empty
  const navCount = await NavFooterSettings.countDocuments();
  if (navCount === 0) {
    seededCount++;
    if (!isDryRun) {
      const nav = new NavFooterSettings({
        navLinks: [
          { label: 'Home', url: 'index.html', order: 1 },
          { label: 'About', url: 'about.html', order: 2 },
          { label: 'Team', url: 'team.html', order: 3 },
          { label: 'Car', url: 'car.html', order: 4 },
          { label: 'Gallery', url: 'gallery.html', order: 5 },
          { label: 'Sponsors', url: 'sponsors.html', order: 6 },
          { label: 'Achievements', url: 'achievements.html', order: 7 },
          { label: 'Contact', url: 'contact.html', order: 8 },
          { label: 'Join Team', url: 'index.html#recruitment', isCta: true, order: 9 },
        ],
        status: 'published',
      });
      nav.publishedVersion = buildSnapshot(nav.toObject());
      await nav.save();
    }
  }

  // 8. Seed SiteSeoSettings if empty
  const seoCount = await SiteSeoSettings.countDocuments();
  if (seoCount === 0) {
    seededCount++;
    if (!isDryRun) {
      const seo = new SiteSeoSettings({
        pagesSeo: [
          { pageKey: 'home', title: 'Ashwa Riders — Home', description: 'Central India’s premier electric Formula Student team.' },
          { pageKey: 'about', title: 'Ashwa Riders — About Us', description: 'Driven by innovation and passion for electric motorsport.' },
          { pageKey: 'car', title: 'Ashwa Riders — Our Car', description: 'Explore Tarkshya EV technical specifications and features.' },
          { pageKey: 'team', title: 'Ashwa Riders — Team Roster', description: 'Meet our student engineers, faculty advisors, and team lead.' },
          { pageKey: 'achievements', title: 'Ashwa Riders — Achievements', description: 'Formula Bharat ranks and competition awards.' },
          { pageKey: 'gallery', title: 'Ashwa Riders — Media Gallery', description: 'Photos and videos of our workshop, testing, and race events.' },
          { pageKey: 'sponsors', title: 'Ashwa Riders — Corporate Sponsors', description: 'Partner with us and sponsor Central India’s EV race car.' },
          { pageKey: 'contact', title: 'Ashwa Riders — Contact Us', description: 'Get in touch with our pit lane and team leads.' },
        ],
        status: 'published',
      });
      seo.publishedVersion = buildSnapshot(seo.toObject());
      await seo.save();
    }
  }

  console.log(`✅  Migration Summary:`);
  console.log(`    - Upgraded Records: ${updatedCount}`);
  console.log(`    - Seeded Missing Records: ${seededCount}`);
  console.log(`\n🎉  Migration completed successfully in ${isDryRun ? 'DRY-RUN' : 'EXECUTE'} mode.`);

  await mongoose.disconnect();
  process.exit(0);
};

runMigration().catch((err) => {
  console.error('❌  Migration error:', err.message);
  process.exit(1);
});
