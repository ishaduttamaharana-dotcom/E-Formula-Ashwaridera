// ============================================================
//  tests/phase2-backend-verification.js
//  Automated Verification Test Suite for Phase 2 CMS Backend Foundation.
// ============================================================

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const app = require('../app');
const NewsArticle = require('../models/NewsArticle');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtHelper');

const runTests = async () => {
  console.log('===========================================================');
  console.log('🧪 Running Phase 2 CMS Backend Verification Test Suite');
  console.log('===========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);

  // Start ephemeral server
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, failureMsg = '') => {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName} — ${failureMsg}`);
      failed++;
    }
  };

  // Find Admin User for tokens
  const adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.error('❌ Admin user not found in database. Seed admin before testing.');
    server.close();
    process.exit(1);
  }

  const adminToken = generateToken({ id: adminUser._id });

  try {
    // Test 1: Draft Creation & Public Isolation
    const testArticle = new NewsArticle({
      title: 'Test Verification Draft Article',
      description: 'Testing draft isolation from public visitors',
      category: 'Testing',
      status: 'draft',
      draftVersion: {
        title: 'Test Verification Draft Article',
        description: 'Testing draft isolation from public visitors',
      },
    });
    await testArticle.save();

    // Fetch public news
    const resPublic = await fetch(`${baseUrl}/api/v1/home/news`);
    const dataPublic = await resPublic.json();

    const isLeaked = dataPublic.data && dataPublic.data.some((item) => item.id === String(testArticle._id) || item.title === 'Test Verification Draft Article');
    assert(!isLeaked, 'Drafts are isolated from public GET endpoints');

    // Test 2: Publishing Atomically Updates Public Response
    testArticle.publishedVersion = {
      title: 'Test Verification Draft Article (Published)',
      description: 'Published content test',
    };
    testArticle.status = 'published';
    await testArticle.save();

    const resPublished = await fetch(`${baseUrl}/api/v1/home/news`);
    const dataPublished = await resPublished.json();
    const isVisible = dataPublished.data && dataPublished.data.some((item) => item.title === 'Test Verification Draft Article (Published)');
    assert(isVisible, 'Publishing makes content publicly readable');

    // Test 3: Updating Draft Preserves Currently Published Version
    testArticle.draftVersion = {
      title: 'NEW UNPUBLISHED DRAFT TITLE',
      description: 'Work in progress',
    };
    await testArticle.save();

    const resPreserved = await fetch(`${baseUrl}/api/v1/home/news`);
    const dataPreserved = await resPreserved.json();
    const stillPublished = dataPreserved.data && dataPreserved.data.some((item) => item.title === 'Test Verification Draft Article (Published)');
    const draftLeaked = dataPreserved.data && dataPreserved.data.some((item) => item.title === 'NEW UNPUBLISHED DRAFT TITLE');
    assert(stillPublished && !draftLeaked, 'Editing a published record preserves the published snapshot');

    // Test 4: Archiving Removes Public Visibility
    testArticle.status = 'archived';
    await testArticle.save();

    const resArchived = await fetch(`${baseUrl}/api/v1/home/news`);
    const dataArchived = await resArchived.json();
    const isArchivedVisible = dataArchived.data && dataArchived.data.some((item) => item.title === 'Test Verification Draft Article (Published)');
    assert(!isArchivedVisible, 'Archiving content removes it from public response');

    // Test 5: Restoring to Draft does NOT republish
    testArticle.status = 'draft';
    await testArticle.save();

    const resRestored = await fetch(`${baseUrl}/api/v1/home/news`);
    const dataRestored = await resRestored.json();
    const isRestoredPublished = dataRestored.data && dataRestored.data.some((item) => item.title === 'Test Verification Draft Article (Published)');
    assert(!isRestoredPublished, 'Restoring to draft does not automatically republish content');

    // Cleanup test article
    await NewsArticle.findByIdAndDelete(testArticle._id);

    // Test 6: Optimistic Concurrency Lock (409 Conflict)
    const newDoc = new NewsArticle({
      title: 'Concurrency Lock Test',
      description: 'Testing version check',
      version: 5,
      status: 'draft',
    });
    await newDoc.save();

    const conflictRes = await fetch(`${baseUrl}/api/v1/admin/news/${newDoc._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Stale Edit Try',
        version: 3, // Stale version != 5
      }),
    });
    const conflictData = await conflictRes.json();
    assert(conflictRes.status === 409 && conflictData.success === false, 'Stale edits return HTTP 409 Conflict error');

    await NewsArticle.findByIdAndDelete(newDoc._id);

    // Test 7: Unauthorized Admin Access Rejection
    const unauthRes = await fetch(`${baseUrl}/api/v1/admin/dashboard`);
    assert(unauthRes.status === 401, 'Unauthenticated admin endpoint requests return 401 Unauthorized');

  } catch (err) {
    console.error('Test execution error:', err.message);
  } finally {
    server.close();
  }

  console.log('\n===========================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('===========================================================');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

runTests();
