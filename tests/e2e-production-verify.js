const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('🧪 Starting E2E Production Verification...');
  let failed = false;

  // 1. Health check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', res.status, res.data.message || res.data.status);
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    failed = true;
  }

  // 2. Navigation Content
  try {
    const res = await axios.get(`${BASE_URL}/content/navigation`);
    console.log('✅ Navigation Content:', res.status, 'Brand:', res.data.data.branding?.brandTitle);
  } catch (err) {
    console.error('❌ Navigation Content failed:', err.message);
    failed = true;
  }

  // 3. Home Content
  try {
    const res = await axios.get('http://localhost:5000/api/v1/home');
    console.log('✅ Home Content:', res.status, 'Slides count:', res.data.data?.heroSlides?.length || 0);
  } catch (err) {
    console.error('❌ Home Content failed:', err.message);
    failed = true;
  }

  // 4. Admin Login
  let adminToken = '';
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@ashwariders.com',
      password: 'Admin@Ashwa2026!',
    });
    adminToken = res.data.token || (res.data.data && res.data.data.token);
    console.log('✅ Admin Login:', res.status, 'Token acquired:', !!adminToken);
  } catch (err) {
    console.error('❌ Admin Login failed:', err.response?.data || err.message);
    failed = true;
  }

  const authHeaders = { Authorization: `Bearer ${adminToken}` };

  // 5. Media Signature Generation (Direct Cloudinary upload support)
  try {
    const res = await axios.get(`${BASE_URL}/admin/media/signature?folder=ashwa_cms/test`, { headers: authHeaders });
    console.log('✅ Media Signature:', res.status, 'Signature:', res.data.data?.signature ? 'Generated' : 'Missing', 'ApiKey:', res.data.data?.apiKey ? 'Present' : 'Missing');
  } catch (err) {
    console.error('❌ Media Signature failed:', err.response?.data || err.message);
    failed = true;
  }

  // 6. Direct Record Creation
  let testAssetId = '';
  try {
    const res = await axios.post(`${BASE_URL}/admin/media/direct-record`, {
      publicId: 'test_direct_asset_' + Date.now(),
      url: 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png',
      secureUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1785320787/092-removebg-preview_jwh6b6.png',
      resourceType: 'image',
      format: 'png',
      bytes: 12345,
      altText: 'Verification Direct Upload Test',
    }, { headers: authHeaders });
    testAssetId = res.data.data?._id;
    console.log('✅ Direct Record Creation:', res.status, 'Asset ID:', testAssetId);
  } catch (err) {
    console.error('❌ Direct Record Creation failed:', err.response?.data || err.message);
    failed = true;
  }

  // Clean up test asset
  if (testAssetId) {
    try {
      await axios.delete(`${BASE_URL}/admin/media/${testAssetId}`, { headers: authHeaders });
      console.log('✅ Test Asset Cleanup: Success');
    } catch (err) {
      console.warn('⚠️ Test Asset Cleanup warning:', err.message);
    }
  }

  // 7. Stranger Contact Submission
  try {
    const res = await axios.post(`${BASE_URL}/contact/submit`, {
      name: 'Verification Visitor',
      email: 'visitor.e2e@ashwariders.com',
      subject: 'E2E System Audit',
      message: 'Verifying end to end contact message persistence.',
    });
    console.log('✅ Stranger Contact Submission:', res.status, res.data.message);
  } catch (err) {
    console.error('❌ Stranger Contact Submission failed:', err.response?.data || err.message);
    failed = true;
  }

  // 8. Stranger Join Team Application
  try {
    const res = await axios.post(`${BASE_URL}/join`, {
      fullName: 'Formula Applicant',
      email: 'applicant.e2e@ashwariders.com',
      phone: '+91 9876543210',
      college: 'SVPCET Nagpur',
      branch: 'Electrical Engineering',
      currentYear: '3rd Year',
      department: 'Powertrain',
      motivation: 'Passionate about Formula Student EV battery pack thermal management.',
    });
    console.log('✅ Stranger Join Application Submission:', res.status, res.data.message);
  } catch (err) {
    console.error('❌ Stranger Join Application Submission failed:', err.response?.data || err.message);
    failed = true;
  }

  // 9. Stranger Sponsor Enquiry
  try {
    const res = await axios.post(`${BASE_URL}/sponsors/enquiry`, {
      name: 'Corporate Partner',
      organisation: 'Ashwa Tech Labs',
      email: 'sponsor.e2e@ashwariders.com',
      phone: '+91 9988776655',
      tier: 'Gold Tier Sponsor',
      message: 'Interested in sponsoring telemetry sensors for the 2026 season.',
    });
    console.log('✅ Stranger Sponsor Enquiry Submission:', res.status, res.data.message);
  } catch (err) {
    console.error('❌ Stranger Sponsor Enquiry failed:', err.response?.data || err.message);
    failed = true;
  }

  // 10. Live Admin Inbox Counts
  try {
    const res = await axios.get(`${BASE_URL}/admin/inbox-counts`, { headers: authHeaders });
    console.log('✅ Live Admin Inbox Counts:', res.status, res.data.data);
  } catch (err) {
    console.error('❌ Live Admin Inbox Counts failed:', err.response?.data || err.message);
    failed = true;
  }

  console.log('\n==========================================');
  if (failed) {
    console.error('❌ E2E VERIFICATION FAILED.');
    process.exit(1);
  } else {
    console.log('🎉 ALL E2E PRODUCTION VERIFICATIONS PASSED.');
    process.exit(0);
  }
}

runTests();
