// ============================================================
//  tests/phase8-integration-verification.js
//  Automated Integration & Regression Verification Suite for Phase 8.
// ============================================================

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
let adminToken = '';
let testNewsId = '';
let initialVersion = 1;
let createdRevisionId = '';

const runTests = async () => {
  console.log('===========================================================');
  console.log('🧪 Running Phase 8 Integration & Regression Verification Suite');
  console.log('===========================================================');
  console.log('');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASSED: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Admin Login & Authentication Check
    const loginRes = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@ashwariders.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@Ashwa2026!',
    });
    const rawCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    const cookieHeader = rawCookie.split(';')[0];
    assert(loginRes.status === 200 && loginRes.data.success, 'Admin authentication successful.');

    const adminAxios = axios.create({
      baseURL: `${BASE_URL}/api/v1/admin`,
      headers: {
        Cookie: cookieHeader,
      },
    });

    // 2. Access Control Enforcement — Guest Rejection
    try {
      await axios.get(`${BASE_URL}/api/v1/admin/dashboard`);
      assert(false, 'Guest request to admin endpoint was rejected.');
    } catch (err) {
      assert(err.response && err.response.status === 401, 'Guest request to admin endpoint returned 401 Unauthorized.');
    }

    // 3. Complete Edit-to-Publish Flow for Repeatable Resource (News)
    const createDraftRes = await adminAxios.post('/news', {
      title: 'Phase 8 Integration Test News Article',
      description: 'Short description for verification test.',
      category: 'Phase 8 Test',
      content: 'Testing full revision and publication lifecycle.',
    });
    testNewsId = createDraftRes.data.data._id;
    initialVersion = createDraftRes.data.data.version;
    assert(createDraftRes.status === 201 && createDraftRes.data.data.status === 'draft', 'Draft news article created successfully.');

    // 4. Draft Isolation Check (Draft must NOT appear on public GET)
    const publicNewsRes1 = await axios.get(`${BASE_URL}/api/v1/home/news`);
    const isPublicBeforePublish = publicNewsRes1.data.data.some((item) => item._id === testNewsId);
    assert(!isPublicBeforePublish, 'Draft content is isolated from public GET endpoints.');

    // 5. Publish Flow & Revision Record Verification
    const publishRes = await adminAxios.post(`/news/${testNewsId}/publish`);
    assert(publishRes.status === 200 && publishRes.data.data.status === 'published', 'News article published successfully.');

    const publicNewsRes2 = await axios.get(`${BASE_URL}/api/v1/home/news`);
    const isPublicAfterPublish = publicNewsRes2.data.data.some((item) => item.id === String(testNewsId) || item._id === String(testNewsId));
    assert(isPublicAfterPublish, 'Published content is accessible on public GET endpoint.');

    // 6. Revision History Logging Check
    const revisionsRes = await adminAxios.get(`/revisions?resourceType=NewsArticle&resourceId=${testNewsId}`);
    assert(revisionsRes.status === 200 && revisionsRes.data.data.length > 0, 'Content revision history recorded automatically.');
    if (revisionsRes.data.data.length > 0) {
      createdRevisionId = revisionsRes.data.data[0]._id;
    }

    // 7. Stale Update Conflict Check (409 Conflict)
    try {
      await adminAxios.patch(`/news/${testNewsId}`, {
        title: 'Conflicting Title Update',
        version: initialVersion, // Stale version number
      });
      assert(false, 'Stale edit returned HTTP 409 Conflict.');
    } catch (err) {
      assert(err.response && err.response.status === 409, 'Stale edit returned HTTP 409 Conflict error as expected.');
    }

    // 8. Restore Revision to Draft Verification
    if (createdRevisionId) {
      const restoreRes = await adminAxios.post(`/revisions/${createdRevisionId}/restore`);
      assert(restoreRes.status === 200 && restoreRes.data.data.status === 'draft', 'Historical revision restored as new working draft.');
    }

    // 9. Cache-Control Header Check for API Endpoints
    const healthRes = await axios.get(`${BASE_URL}/api/v1/health`);
    assert(healthRes.headers['cache-control'] && healthRes.headers['cache-control'].includes('no-cache'), 'API responses include Cache-Control no-cache headers.');

    // 10. Public Contact Form Submission Verification
    const contactSubRes = await axios.post(`${BASE_URL}/api/v1/contact/submit`, {
      name: 'Phase 8 Tester',
      email: 'tester@ashwariders.com',
      subject: 'Integration Verification',
      message: 'Testing public contact submission flow.',
    });
    assert((contactSubRes.status === 200 || contactSubRes.status === 201) && contactSubRes.data.success, 'Public contact form submits successfully to backend.');

    // 11. Activity Audit Log Verification
    const activityRes = await adminAxios.get('/activity');
    assert(activityRes.status === 200 && activityRes.data.data.length > 0, 'Activity audit trail events retrieved successfully.');

    // Cleanup test record
    await adminAxios.post(`/news/${testNewsId}/archive`);
    console.log('');
    console.log('===========================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('===========================================================');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌  Verification suite error:', err.message);
    if (err.response) console.error('   Details:', err.response.data);
    process.exit(1);
  }
};

runTests();
