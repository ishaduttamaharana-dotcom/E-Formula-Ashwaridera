// ============================================================
//  tests/universal-cms-verification.js
//  Automated Verification Suite for Universal CMS Architecture
// ============================================================

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ashwariders.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Ashwa2026!';

let authCookie = '';
let testTypeId = '';
let testItemId = '';
let duplicatedItemId = '';

async function runUniversalCmsTests() {
  console.log('===========================================================');
  console.log('🧪 Running Universal CMS Architecture & Engine Test Suite');
  console.log('===========================================================');
  console.log('');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const cookies = loginRes.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      authCookie = cookies[0].split(';')[0];
    }
    assert(loginRes.status === 200, 'Admin authentication successful');

    const authHeaders = { headers: { Cookie: authCookie } };

    // 2. Fetch Pre-Seeded Content Types
    const typesRes = await axios.get(`${BASE_URL}/content-types`);
    assert(typesRes.status === 200 && typesRes.data.count >= 10, 'Pre-seeded built-in content types fetched (10+ types)');

    const heroType = typesRes.data.data.find(t => t.slug === 'hero_slide');
    assert(heroType && heroType.fields.length >= 8, 'Hero slide content type schema verified with standard fields');

    const testTypeSlug = `restaurant_${Date.now()}`;

    // 3. Create Custom Content Type ("restaurant")
    const createTypeRes = await axios.post(`${BASE_URL}/content-types/admin`, {
      name: 'Restaurants',
      singularName: 'Restaurant',
      pluralName: 'Restaurants',
      slug: testTypeSlug,
      icon: 'utensils',
      description: 'Hospitality partner restaurants',
      fields: [
        { key: 'title', label: 'Restaurant Name', type: 'text', required: true },
        { key: 'cuisine', label: 'Cuisine Type', type: 'text' },
        { key: 'rating', label: 'Rating', type: 'number', defaultValue: 5 },
        { key: 'image', label: 'Cover Photo', type: 'media' },
      ],
    }, authHeaders);

    assert(createTypeRes.status === 201 && createTypeRes.data.data.slug === testTypeSlug, `Created custom content type "${testTypeSlug}" dynamically`);

    // 4. Create Draft Content Item under custom type
    const createItemRes = await axios.post(`${BASE_URL}/content-items/admin/${testTypeSlug}`, {
      title: 'Ashwa Formula Diner',
      fields: {
        cuisine: 'Italian & Racing Snacks',
        rating: 5,
        image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      },
      status: 'draft',
    }, authHeaders);

    testItemId = createItemRes.data.data._id;
    assert(createItemRes.status === 201 && createItemRes.data.data.status === 'draft', 'Created draft item under custom content type');

    // 5. Verify Draft Isolation on Public Endpoint
    const publicDraftCheck = await axios.get(`${BASE_URL}/content-items/public/${testTypeSlug}`);
    assert(publicDraftCheck.data.count === 0, 'Draft item is isolated from public GET endpoint');

    // 6. Publish Content Item
    const publishRes = await axios.put(`${BASE_URL}/content-items/admin/${testTypeSlug}/${testItemId}`, {
      title: 'Ashwa Formula Diner (Updated)',
      publish: true,
    }, authHeaders);

    assert(publishRes.status === 200 && publishRes.data.data.status === 'published', 'Published content item explicitly');

    // 7. Verify Published Item on Public Endpoint
    const publicPublishCheck = await axios.get(`${BASE_URL}/content-items/public/${testTypeSlug}`);
    assert(publicPublishCheck.data.count === 1 && publicPublishCheck.data.data[0].title.includes('Ashwa Formula Diner'), 'Published item is accessible on public GET endpoint');

    // 8. One-Click Duplication
    const duplicateRes = await axios.post(`${BASE_URL}/content-items/admin/${testTypeSlug}/${testItemId}/duplicate`, {}, authHeaders);
    duplicatedItemId = duplicateRes.data.data._id;
    assert(duplicateRes.status === 201 && duplicateRes.data.data.title.includes('(Copy)'), 'One-click duplication created draft copy with "(Copy)" suffix');

    // 9. Global Cross-Content-Type Search
    const searchRes = await axios.get(`${BASE_URL}/content-items/admin/global-search?q=Formula`, authHeaders);
    assert(searchRes.status === 200 && searchRes.data.count >= 1, 'Global search returned matching items across content types');

    // 10. Clean up test records
    await axios.delete(`${BASE_URL}/content-items/admin/${testTypeSlug}/${testItemId}`, authHeaders);
    await axios.delete(`${BASE_URL}/content-items/admin/${testTypeSlug}/${duplicatedItemId}`, authHeaders);
    await axios.delete(`${BASE_URL}/content-types/admin/${testTypeSlug}`, authHeaders);
    assert(true, 'Cleaned up temporary test content and custom type');

  } catch (err) {
    console.error('Test Exception:', err.response ? err.response.data : err.message);
    failed++;
  }

  console.log('');
  console.log('===========================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('===========================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runUniversalCmsTests();
