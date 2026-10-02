// ============================================================
//  tests/verify-no-obsolete-sponsors.js
//  Automated Verification for Obsolete Partner Category Removal.
// ============================================================

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch(e){}

require('dotenv').config();
const mongoose = require('mongoose');
const Sponsor = require('../models/Sponsor');
const { getOrSeedHomeDoc } = require('../controllers/homePageController');
const { getOrSeedSponsorDoc } = require('../controllers/sponsorPageController');

async function testSuite() {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 RUNNING OBSOLETE PARTNER VERIFICATION SUITE');
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log('  ✅ PASS:', message);
      passed++;
    } else {
      console.error('  ❌ FAIL:', message);
      failed++;
    }
  }

  // TEST 1: Sponsor Mongoose Model Enum Rejection
  console.log('Test 1: Sponsor Schema Enum Validation');
  const invalidSponsor = new Sponsor({
    name: 'Invalid Test Sponsor',
    tier: 'Technical Partner',
    logoUrl: 'https://example.com/logo.png',
  });
  let errCaught = false;
  try {
    await invalidSponsor.validate();
  } catch (err) {
    errCaught = true;
    assert(err.errors?.tier !== undefined, 'Mongoose rejected tier "Technical Partner" via Schema enum.');
  }
  assert(errCaught, 'Validation error was thrown for obsolete category.');

  // TEST 2: Valid Sponsor Creation allowed
  console.log('\nTest 2: Valid Sponsor Schema Validation');
  const validSponsor = new Sponsor({
    name: 'Valid Gold Sponsor',
    tier: 'Gold',
    logoUrl: 'https://example.com/gold.png',
  });
  let validErr = null;
  try {
    await validSponsor.validate();
  } catch (err) {
    validErr = err;
  }
  assert(validErr === null, 'Mongoose accepted valid tier "Gold".');

  // TEST 3: Check HomePageContent in MongoDB
  console.log('\nTest 3: HomePageContent Database Document Audit');
  const homeDoc = await getOrSeedHomeDoc();
  const tiers = homeDoc.footerSponsors?.sponsorSection?.tiers || [];
  const obsoleteTiers = tiers.filter(t => /technical|education|educational|media/i.test(t.name) || /technical|education|educational|media/i.test(t.slug));
  assert(obsoleteTiers.length === 0, `HomePageContent contains 0 obsolete tiers (found: ${obsoleteTiers.length}).`);
  
  const allSponsors = tiers.flatMap(t => t.sponsors || []);
  const obsoleteSponsors = allSponsors.filter(s => /technical|education|educational|media/i.test(s.tier || '') || ['bosch', 'zuken', 'iit bombay', 'bms college', 'ev reporter', 'sportskeeda'].includes((s.name || '').toLowerCase()));
  assert(obsoleteSponsors.length === 0, `HomePageContent contains 0 obsolete sponsor items (found: ${obsoleteSponsors.length}).`);

  // TEST 4: Check SponsorPageContent in MongoDB
  console.log('\nTest 4: SponsorPageContent Database Document Audit');
  const sponsorDoc = await getOrSeedSponsorDoc();
  const railItems = sponsorDoc.rail?.items || [];
  const obsoleteRail = railItems.filter(r => /technical|education|educational|media/i.test(r.tier || ''));
  assert(obsoleteRail.length === 0, `SponsorPageContent rail contains 0 obsolete items (found: ${obsoleteRail.length}).`);

  const sponsorTiers = sponsorDoc.tiersSection?.tiers || [];
  const obsoleteSponsorTiers = sponsorTiers.filter(t => /technical|education|educational|media/i.test(t.title || ''));
  assert(obsoleteSponsorTiers.length === 0, `SponsorPageContent tiers contain 0 obsolete titles (found: ${obsoleteSponsorTiers.length}).`);

  await mongoose.disconnect();

  console.log('\n═══════════════════════════════════════════════');
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

testSuite().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
