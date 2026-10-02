// ============================================================
//  scripts/cleanup-obsolete-sponsor-categories.js
//  Safe One-Time & Re-runnable Database Migration Script.
//  Permanently removes Technical, Education, and Media partner
//  categories and obsolete records from MongoDB Atlas.
//
//  Usage:
//    node scripts/cleanup-obsolete-sponsor-categories.js
// ============================================================

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const OBSOLETE_REGEX = /technical|education|educational|media/i;
const OBSOLETE_NAMES = ['bosch', 'zuken', 'iit bombay', 'bms college', 'ev reporter', 'sportskeeda'];

const isObsoleteCategory = (str) => {
  if (!str || typeof str !== 'string') return false;
  const s = str.toLowerCase().trim();
  return (
    s.includes('technical') ||
    s.includes('education') ||
    s.includes('educational') ||
    s.includes('media partner') ||
    s.includes('media-partner') ||
    s === 'media'
  );
};

const isObsoleteSponsor = (s) => {
  if (!s || typeof s !== 'object') return false;
  if (isObsoleteCategory(s.tier) || isObsoleteCategory(s.tierName)) return true;
  const name = (s.name || '').toLowerCase().trim();
  return OBSOLETE_NAMES.includes(name);
};

const cleanTiersArray = (tiers) => {
  if (!Array.isArray(tiers)) return tiers;
  return tiers
    .filter((t) => !isObsoleteCategory(t.name) && !isObsoleteCategory(t.slug) && !isObsoleteCategory(t.id))
    .map((t, idx) => ({
      ...t,
      order: idx,
      sponsors: Array.isArray(t.sponsors)
        ? t.sponsors
            .filter((sp) => !isObsoleteSponsor(sp))
            .map((sp, sIdx) => ({ ...sp, order: sIdx }))
        : [],
    }));
};

const cleanRailItems = (items) => {
  if (!Array.isArray(items)) return items;
  return items
    .filter((item) => !isObsoleteCategory(item.tier) && !isObsoleteSponsor(item))
    .map((item, idx) => ({ ...item, order: idx + 1 }));
};

const runCleanup = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('✅ Connected successfully.\n');

  let totalRemovedRecords = 0;

  // 1. Clean home_page_content
  console.log('--- 1. Cleaning home_page_content collection ---');
  const homeContents = await db.collection('home_page_content').find().toArray();
  for (const doc of homeContents) {
    let modified = false;
    const currentTiers = doc.footerSponsors?.sponsorSection?.tiers || [];
    const beforeCount = currentTiers.length;
    const cleanedTiers = cleanTiersArray(currentTiers);
    const removedCount = beforeCount - cleanedTiers.length;

    if (removedCount > 0 || JSON.stringify(cleanedTiers) !== JSON.stringify(currentTiers)) {
      console.log(`  Found ${removedCount} obsolete tiers in home_page_content ${doc._id}. Cleaning...`);
      totalRemovedRecords += removedCount;

      const updateFields = {
        'footerSponsors.sponsorSection.tiers': cleanedTiers,
      };

      if (doc.publishedVersion?.footerSponsors?.sponsorSection?.tiers) {
        updateFields['publishedVersion.footerSponsors.sponsorSection.tiers'] = cleanTiersArray(
          doc.publishedVersion.footerSponsors.sponsorSection.tiers
        );
      }
      if (doc.draftVersion?.footerSponsors?.sponsorSection?.tiers) {
        updateFields['draftVersion.footerSponsors.sponsorSection.tiers'] = cleanTiersArray(
          doc.draftVersion.footerSponsors.sponsorSection.tiers
        );
      }

      await db.collection('home_page_content').updateOne(
        { _id: doc._id },
        { $set: updateFields }
      );
      console.log(`  ✅ Successfully cleaned tiers in home_page_content ${doc._id}.`);
    } else {
      console.log(`  No obsolete tiers found in home_page_content ${doc._id}.`);
    }
  }

  // 2. Clean sponsor_page_contents
  console.log('\n--- 2. Cleaning sponsor_page_contents collection ---');
  const sponsorContents = await db.collection('sponsor_page_contents').find().toArray();
  for (const doc of sponsorContents) {
    const rawRail = doc.rail?.items || [];
    const beforeRailCount = rawRail.length;
    const cleanedRail = cleanRailItems(rawRail);
    const removedRailCount = beforeRailCount - cleanedRail.length;

    if (removedRailCount > 0 || JSON.stringify(cleanedRail) !== JSON.stringify(rawRail)) {
      console.log(`  Found ${removedRailCount} obsolete rail items in sponsor_page_contents ${doc._id}. Cleaning...`);
      totalRemovedRecords += removedRailCount;

      const updateFields = {
        'rail.items': cleanedRail,
      };

      if (doc.publishedVersion?.rail?.items) {
        updateFields['publishedVersion.rail.items'] = cleanRailItems(doc.publishedVersion.rail.items);
      }
      if (doc.draftVersion?.rail?.items) {
        updateFields['draftVersion.rail.items'] = cleanRailItems(doc.draftVersion.rail.items);
      }

      // Check tiersSection
      if (doc.tiersSection?.tiers && Array.isArray(doc.tiersSection.tiers)) {
        updateFields['tiersSection.tiers'] = doc.tiersSection.tiers.map((t) => ({
          ...t,
          title: isObsoleteCategory(t.title) ? 'Silver Sponsor' : t.title,
        }));
      }

      await db.collection('sponsor_page_contents').updateOne(
        { _id: doc._id },
        { $set: updateFields }
      );
      console.log(`  ✅ Successfully cleaned rail items in sponsor_page_contents ${doc._id}.`);
    } else {
      console.log(`  No obsolete rail items found in sponsor_page_contents ${doc._id}.`);
    }
  }

  // 3. Clean sponsors collection
  console.log('\n--- 3. Cleaning sponsors collection ---');
  const sponsorResult = await db.collection('sponsors').deleteMany({
    $or: [
      { tier: { $regex: OBSOLETE_REGEX } },
      { name: { $in: OBSOLETE_NAMES.map((n) => new RegExp(`^${n}$`, 'i')) } },
    ],
  });
  console.log(`  Deleted ${sponsorResult.deletedCount} obsolete records from sponsors collection.`);
  totalRemovedRecords += sponsorResult.deletedCount;

  // 4. Clean home_sponsors collection
  console.log('\n--- 4. Cleaning home_sponsors collection ---');
  const homeSponsorResult = await db.collection('home_sponsors').deleteMany({
    $or: [
      { tier: { $regex: OBSOLETE_REGEX } },
      { name: { $in: OBSOLETE_NAMES.map((n) => new RegExp(`^${n}$`, 'i')) } },
    ],
  });
  console.log(`  Deleted ${homeSponsorResult.deletedCount} obsolete records from home_sponsors collection.`);
  totalRemovedRecords += homeSponsorResult.deletedCount;

  // 5. Verification Audit
  console.log('\n═══════════════════════════════════════════════');
  console.log('🔍 VERIFICATION AUDIT');
  console.log('═══════════════════════════════════════════════');

  const verifyHome = await db.collection('home_page_content').findOne();
  if (verifyHome) {
    const tiers = verifyHome.footerSponsors?.sponsorSection?.tiers || [];
    console.log(`HomePageContent remaining tiers (${tiers.length}):`);
    tiers.forEach((t, i) => {
      console.log(`  - Tier ${i + 1}: ${t.name} (sponsors: ${(t.sponsors || []).map((s) => s.name).join(', ')})`);
    });
  }

  const verifySponsor = await db.collection('sponsor_page_contents').findOne();
  if (verifySponsor) {
    const rail = verifySponsor.rail?.items || [];
    console.log(`SponsorPageContent remaining rail items (${rail.length}):`);
    rail.forEach((r, i) => {
      console.log(`  - ${r.name} (${r.tier})`);
    });
  }

  console.log(`\n🎉 Total Obsolete Records Cleaned: ${totalRemovedRecords}`);
  console.log('Database cleanup completed successfully.');

  await mongoose.disconnect();
};

runCleanup().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
