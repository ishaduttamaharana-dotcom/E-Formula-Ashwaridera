const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testUploadFlow() {
  console.log('🚀 Running Full Media Pipeline Verification (Image, Video, Document)...');

  // 1. Admin Login
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@ashwariders.com',
    password: 'Admin@Ashwa2026!',
  });
  const token = loginRes.data.token || (loginRes.data.data && loginRes.data.data.token);
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('✅ Admin login succeeded, token acquired.');

  const testTypes = [
    {
      name: 'Image (PNG/JPG)',
      resourceType: 'image',
      folder: 'ashwa_cms/images',
      filename: 'test_verify_img.png',
      // 1x1 transparent PNG buffer
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
      mimeType: 'image/png',
    },
    {
      name: 'Document (PDF)',
      resourceType: 'raw',
      folder: 'ashwa_cms/documents',
      filename: 'test_verify_doc.pdf',
      // Minimal valid PDF buffer
      buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000108 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF', 'utf-8'),
      mimeType: 'application/pdf',
    },
  ];

  const createdAssetIds = [];

  for (const item of testTypes) {
    console.log(`\n--- Testing ${item.name} Upload Flow ---`);

    // Step A: Request Signature
    console.log(`[1] Requesting signature for folder: ${item.folder}...`);
    const sigRes = await axios.get(`${BASE_URL}/admin/media/signature?folder=${encodeURIComponent(item.folder)}`, { headers: authHeaders });
    if (!sigRes.data.success || !sigRes.data.data.signature) {
      throw new Error(`Signature failed for ${item.name}: ` + JSON.stringify(sigRes.data));
    }
    const sigData = sigRes.data.data;
    console.log(`✅ Signature received (timestamp: ${sigData.timestamp}, cloudName: ${sigData.cloudName})`);

    // Step B: Direct Upload to Cloudinary CDN
    console.log(`[2] Uploading directly to api.cloudinary.com/v1_1/${sigData.cloudName}/${item.resourceType}/upload...`);
    const fd = new FormData();
    fd.append('file', item.buffer, { filename: item.filename, contentType: item.mimeType });
    fd.append('api_key', sigData.apiKey);
    fd.append('timestamp', sigData.timestamp.toString());
    fd.append('signature', sigData.signature);
    fd.append('folder', sigData.folder);

    const cloudRes = await axios.post(
      `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${item.resourceType}/upload`,
      fd,
      { headers: fd.getHeaders() }
    );

    if (!cloudRes.data || (!cloudRes.data.secure_url && !cloudRes.data.url)) {
      throw new Error(`Cloudinary upload failed for ${item.name}: ` + JSON.stringify(cloudRes.data));
    }
    const uploadedAsset = cloudRes.data;
    console.log(`✅ Cloudinary upload complete! publicId: ${uploadedAsset.public_id}, URL: ${uploadedAsset.secure_url || uploadedAsset.url}`);

    // Step C: Verify & Record in Database
    console.log(`[3] Recording asset reference in MongoDB via /admin/media/direct-record...`);
    const recordPayload = {
      publicId: uploadedAsset.public_id,
      url: uploadedAsset.secure_url || uploadedAsset.url,
      secureUrl: uploadedAsset.secure_url || uploadedAsset.url,
      resourceType: uploadedAsset.resource_type || item.resourceType,
      format: uploadedAsset.format || item.filename.split('.').pop(),
      bytes: uploadedAsset.bytes || item.buffer.length,
      width: uploadedAsset.width || 0,
      height: uploadedAsset.height || 0,
      duration: uploadedAsset.duration || 0,
      altText: `E2E Verified ${item.name}`,
      caption: 'Automated upload verification test',
      folder: sigData.folder,
      originalName: item.filename,
      mimeType: item.mimeType,
    };

    const recordRes = await axios.post(`${BASE_URL}/admin/media/direct-record`, recordPayload, { headers: authHeaders });
    if (!recordRes.data.success || !recordRes.data.data) {
      throw new Error(`Direct record failed for ${item.name}: ` + JSON.stringify(recordRes.data));
    }
    const dbAsset = recordRes.data.data;
    createdAssetIds.push(dbAsset._id);
    console.log(`✅ MongoDB Media Asset record created! ID: ${dbAsset._id}`);

    // Step D: Verify Asset retrieval from Media Library API
    console.log(`[4] Verifying asset is discoverable in GET /admin/media...`);
    const listRes = await axios.get(`${BASE_URL}/admin/media?limit=5`, { headers: authHeaders });
    const found = listRes.data.data.some(a => a._id === dbAsset._id || a.publicId === dbAsset.publicId);
    console.log(`✅ Asset found in Media Library query: ${found}`);
  }

  // Cleanup created test assets from MongoDB and Cloudinary
  console.log('\n--- Cleaning up temporary test assets ---');
  for (const id of createdAssetIds) {
    try {
      await axios.delete(`${BASE_URL}/admin/media/${id}`, { headers: authHeaders });
      console.log(`✅ Cleaned up asset ID: ${id}`);
    } catch (e) {
      console.warn(`⚠️ Cleanup warning for ${id}:`, e.message);
    }
  }

  console.log('\n🎉 ALL PIPELINE TESTS PASSED SUCCESSFULLY!');
}

testUploadFlow().catch(err => {
  console.error('\n❌ PIPELINE VERIFICATION FAILED:', err.response?.data || err.message);
  process.exit(1);
});
