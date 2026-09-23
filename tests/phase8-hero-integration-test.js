// ============================================================
//  tests/phase8-hero-integration-test.js
//  Automated Verification Suite for Homepage CMS Integration & Hero Editor.
// ============================================================

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = `http://127.0.0.1:${process.env.PORT || 5000}`;
let cookieHeader = '';
let testHeroId = '';

const runTests = async () => {
  console.log('===========================================================');
  console.log('🧪 Running Phase 8 Hero CMS & Homepage Integration Test Suite');
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
    // Authenticate Admin
    const loginRes = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: process.env.ADMIN_EMAIL || 'admin@ashwariders.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@Ashwa2026!',
    });
    const rawCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
    cookieHeader = rawCookie.split(';')[0];
    assert(loginRes.status === 200 && loginRes.data.success, 'Admin authentication successful.');

    const adminAxios = axios.create({
      baseURL: `${BASE_URL}/api/v1/admin`,
      headers: { Cookie: cookieHeader },
    });

    // ─── TEST 1: Change Hero headline -> Save Draft -> Public API unchanged ───
    const createRes = await adminAxios.post('/hero', {
      heading: 'DRAFT UNPUBLISHED HEADLINE',
      subtitle: 'Testing draft isolation.',
      badgeText: 'Test Badge 2026',
      mediaType: 'video',
      videoUrl: 'https://res.cloudinary.com/test_video.mp4',
      order: 0,
      status: 'draft',
    });
    testHeroId = createRes.data.data._id;
    assert(createRes.status === 201 && createRes.data.data.status === 'draft', 'TEST 1: Hero slide draft created.');

    const publicRes1 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides1 = publicRes1.data.data ? publicRes1.data.data.heroSlides : [];
    const isDraftPublic = slides1.some((item) => item.id === String(testHeroId));
    assert(!isDraftPublic, 'TEST 1: Save Draft does NOT affect public website.');

    // ─── TEST 2: Publish Hero -> Verify public API returns new headline ───
    await adminAxios.post(`/hero/${testHeroId}/publish`);
    const publicRes2 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides2 = publicRes2.data.data ? publicRes2.data.data.heroSlides : [];
    const targetHero2 = slides2.find((item) => item.id === String(testHeroId));
    assert(targetHero2 && targetHero2.heading === 'DRAFT UNPUBLISHED HEADLINE', 'TEST 2: Published Hero headline appears on public GET /api/v1/home.');

    // ─── TEST 3: Change Subtitle -> Publish -> Public API updates ───
    await adminAxios.patch(`/hero/${testHeroId}`, {
      heading: 'DRAFT UNPUBLISHED HEADLINE',
      subtitle: 'PUBLISHED SPEED AND INNOVATION 2026',
      version: createRes.data.data.version + 1,
    });
    await adminAxios.post(`/hero/${testHeroId}/publish`);
    const publicRes3 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides3 = publicRes3.data.data ? publicRes3.data.data.heroSlides : [];
    const targetHero3 = slides3.find((item) => item.id === String(testHeroId));
    assert(targetHero3 && targetHero3.subtitle === 'PUBLISHED SPEED AND INNOVATION 2026', 'TEST 3: Subtitle change updates public payload.');

    // ─── TEST 4: Replace Video URL -> Publish -> Verify video URL ───
    const newVidUrl = 'https://res.cloudinary.com/new_hero_video_2026.mp4';
    await adminAxios.patch(`/hero/${testHeroId}`, {
      mediaType: 'video',
      videoUrl: newVidUrl,
    });
    await adminAxios.post(`/hero/${testHeroId}/publish`);
    const publicRes4 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides4 = publicRes4.data.data ? publicRes4.data.data.heroSlides : [];
    const targetHero4 = slides4.find((item) => item.id === String(testHeroId));
    assert(targetHero4 && targetHero4.videoUrl === newVidUrl, 'TEST 4: Replaced video URL exposes on public payload.');

    // ─── TEST 5: Replace Desktop Image -> Publish -> Verify desktop image URL ───
    const newImgUrl = 'https://res.cloudinary.com/desktop_hero_chassis.jpg';
    await adminAxios.patch(`/hero/${testHeroId}`, {
      mediaType: 'image',
      imageUrl: newImgUrl,
    });
    await adminAxios.post(`/hero/${testHeroId}/publish`);
    const publicRes5 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides5 = publicRes5.data.data ? publicRes5.data.data.heroSlides : [];
    const targetHero5 = slides5.find((item) => item.id === String(testHeroId));
    assert(targetHero5 && targetHero5.mediaType === 'image' && targetHero5.imageUrl === newImgUrl, 'TEST 5: Replaced desktop image URL exposes on public payload.');

    // ─── TEST 6: Replace Mobile Image Override -> Publish -> Verify mobile image ───
    const newMobileUrl = 'https://res.cloudinary.com/mobile_hero_portrait.jpg';
    await adminAxios.patch(`/hero/${testHeroId}`, {
      mobileImageUrl: newMobileUrl,
    });
    await adminAxios.post(`/hero/${testHeroId}/publish`);
    const publicRes6 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides6 = publicRes6.data.data ? publicRes6.data.data.heroSlides : [];
    const targetHero6 = slides6.find((item) => item.id === String(testHeroId));
    assert(targetHero6 && targetHero6.mobileImageUrl === newMobileUrl, 'TEST 6: Replaced mobile image override exposes on public payload.');

    // ─── TEST 7: Change CTA Text and URL -> Publish -> Verify CTAs ───
    await adminAxios.patch(`/hero/${testHeroId}`, {
      primaryBtnText: 'TEST CAR 2026',
      primaryBtnLink: 'car.html#spec',
      secondaryBtnText: 'PARTNER WITH US',
      secondaryBtnLink: 'sponsors.html#tiers',
    });
    await adminAxios.post(`/hero/${testHeroId}/publish`);
    const publicRes7 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slides7 = publicRes7.data.data ? publicRes7.data.data.heroSlides : [];
    const targetHero7 = slides7.find((item) => item.id === String(testHeroId));
    assert(
      targetHero7 &&
      targetHero7.primaryBtnText === 'TEST CAR 2026' &&
      targetHero7.secondaryBtnLink === 'sponsors.html#tiers',
      'TEST 7: Primary and Secondary CTAs update on public payload.'
    );

    // ─── TEST 8 & 9: Order and Multiple Hero Slides ───
    const createRes2 = await adminAxios.post('/hero', {
      heading: 'SECOND HERO SLIDE',
      subtitle: 'Second slide subtitle',
      mediaType: 'image',
      imageUrl: 'https://res.cloudinary.com/slide2.jpg',
      order: 2,
    });
    await adminAxios.post(`/hero/${createRes2.data.data._id}/publish`);
    const publicRes8 = await axios.get(`${BASE_URL}/api/v1/home`);
    const slidesList = publicRes8.data.data ? publicRes8.data.data.heroSlides : [];
    assert(slidesList.length >= 2, 'TEST 8 & 9: Multiple published hero slides returned in sorted order.');

    // ─── TEST 10: Verify Combined Homepage Payload (BuildStory, News, Stats, Sponsors) ───
    const combinedRes = await axios.get(`${BASE_URL}/api/v1/home`);
    const data = combinedRes.data.data;
    assert(
      data &&
      Array.isArray(data.buildStory) &&
      Array.isArray(data.news) &&
      Array.isArray(data.statistics) &&
      Array.isArray(data.sponsors),
      'TEST 10: Unified GET /api/v1/home returns published content for all homepage sections.'
    );

    // Cleanup test records
    await adminAxios.post(`/hero/${testHeroId}/archive`);
    await adminAxios.post(`/hero/${createRes2.data.data._id}/archive`);

    console.log('');
    console.log('===========================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('===========================================================');
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('❌  Verification test suite error:', err.message);
    if (err.response) console.error('   Details:', err.response.data);
    process.exit(1);
  }
};

runTests();
