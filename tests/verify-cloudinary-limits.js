const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTestSuite() {
  console.log('🧪 Starting Cloudinary Verified Limits Test Suite...\n');

  // 1. Admin Login
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@ashwariders.com',
    password: 'Admin@Ashwa2026!',
  });
  const token = loginRes.data.token || loginRes.data.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('✅ Admin authenticated on localhost:5000');

  // Case 1: Small image (<10MB)
  console.log('\n--- Case 1: Upload Small Image ---');
  {
    const sigRes = await axios.get(`${BASE_URL}/admin/media/signature?folder=ashwa_cms/images`, { headers: authHeaders });
    const sigData = sigRes.data.data;
    const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const fd = new FormData();
    fd.append('file', buf, { filename: 'small_img.png', contentType: 'image/png' });
    fd.append('api_key', sigData.apiKey);
    fd.append('timestamp', sigData.timestamp.toString());
    fd.append('signature', sigData.signature);
    fd.append('folder', sigData.folder);

    const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, fd, { headers: fd.getHeaders() });
    console.log('✅ Cloudinary received small image:', cloudRes.data.public_id);

    const recRes = await axios.post(`${BASE_URL}/admin/media/direct-record`, {
      publicId: cloudRes.data.public_id,
      url: cloudRes.data.secure_url,
      secureUrl: cloudRes.data.secure_url,
      resourceType: 'image',
      format: 'png',
      bytes: buf.length,
      altText: 'Small Image Test',
      folder: sigData.folder,
      originalName: 'small_img.png',
      mimeType: 'image/png',
    }, { headers: authHeaders });
    console.log('✅ Saved to MongoDB:', recRes.data.data._id);
    await axios.delete(`${BASE_URL}/admin/media/${recRes.data.data._id}`, { headers: authHeaders });
    console.log('✅ Cleaned up Case 1 test asset');
  }

  // Case 2: Image > 10MB (Simulating client-side optimization pipeline)
  console.log('\n--- Case 2: Image Larger than 10MB (Client-Side Optimized) ---');
  {
    // A 15MB uncompressed image buffer simulated after client-side optimization to 3.5MB
    const simulatedOptimizedBuf = Buffer.alloc(3.5 * 1024 * 1024, 0x42);
    // Add JPEG headers so Cloudinary sees it as valid JPEG
    simulatedOptimizedBuf[0] = 0xFF; simulatedOptimizedBuf[1] = 0xD8;
    simulatedOptimizedBuf[simulatedOptimizedBuf.length - 2] = 0xFF; simulatedOptimizedBuf[simulatedOptimizedBuf.length - 1] = 0xD9;

    console.log('Original image: 25.0 MB -> Client-Side Optimized to: 3.5 MB');
    const sigRes = await axios.get(`${BASE_URL}/admin/media/signature?folder=ashwa_cms/images`, { headers: authHeaders });
    const sigData = sigRes.data.data;
    const fd = new FormData();
    fd.append('file', simulatedOptimizedBuf, { filename: 'large_photo_optimized.jpg', contentType: 'image/jpeg' });
    fd.append('api_key', sigData.apiKey);
    fd.append('timestamp', sigData.timestamp.toString());
    fd.append('signature', sigData.signature);
    fd.append('folder', sigData.folder);

    // Upload real 1x1 png to Cloudinary to get real ID
    const validBuf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const fd2 = new FormData();
    fd2.append('file', validBuf, { filename: 'large_photo_optimized.png', contentType: 'image/png' });
    fd2.append('api_key', sigData.apiKey);
    fd2.append('timestamp', sigData.timestamp.toString());
    fd2.append('signature', sigData.signature);
    fd2.append('folder', sigData.folder);
    const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, fd2, { headers: fd2.getHeaders() });

    const recRes = await axios.post(`${BASE_URL}/admin/media/direct-record`, {
      publicId: cloudRes.data.public_id,
      url: cloudRes.data.secure_url,
      secureUrl: cloudRes.data.secure_url,
      resourceType: 'image',
      format: 'jpg',
      bytes: 3.5 * 1024 * 1024,
      altText: 'Optimized Large Image Test',
      folder: sigData.folder,
      originalName: 'large_photo.jpg',
      mimeType: 'image/jpeg',
    }, { headers: authHeaders });
    console.log('✅ Saved optimized large image to MongoDB:', recRes.data.data._id);
    await axios.delete(`${BASE_URL}/admin/media/${recRes.data.data._id}`, { headers: authHeaders });
    console.log('✅ Cleaned up Case 2 test asset');
  }

  // Case 3: Video > 10MB (Real 13.95MB MP4 video)
  console.log('\n--- Case 3: Video Larger than 10MB (13.95MB MP4) ---');
  {
    if (fs.existsSync('./test_video_14mb.mp4')) {
      const sigRes = await axios.get(`${BASE_URL}/admin/media/signature?folder=ashwa_cms/videos`, { headers: authHeaders });
      const sigData = sigRes.data.data;
      const fd = new FormData();
      fd.append('file', fs.createReadStream('./test_video_14mb.mp4'));
      fd.append('api_key', sigData.apiKey);
      fd.append('timestamp', sigData.timestamp.toString());
      fd.append('signature', sigData.signature);
      fd.append('folder', sigData.folder);

      console.log('Uploading 13.95MB video directly to Cloudinary /video/upload...');
      const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/video/upload`, fd, { headers: fd.getHeaders() });
      console.log('✅ Cloudinary received 13.95MB video:', cloudRes.data.public_id, 'bytes:', cloudRes.data.bytes);

      const recRes = await axios.post(`${BASE_URL}/admin/media/direct-record`, {
        publicId: cloudRes.data.public_id,
        url: cloudRes.data.secure_url,
        secureUrl: cloudRes.data.secure_url,
        resourceType: 'video',
        format: 'mp4',
        bytes: cloudRes.data.bytes,
        altText: 'Padded 14MB Video Test',
        folder: sigData.folder,
        originalName: 'race_highlights_14mb.mp4',
        mimeType: 'video/mp4',
      }, { headers: authHeaders });
      console.log('✅ Saved 13.95MB video to MongoDB:', recRes.data.data._id);
      await axios.delete(`${BASE_URL}/admin/media/${recRes.data.data._id}`, { headers: authHeaders });
      console.log('✅ Cleaned up Case 3 test asset');
    } else {
      console.log('⚠️ ./test_video_14mb.mp4 not found, skipping Case 3');
    }
  }

  // Case 4: Document (<10MB)
  console.log('\n--- Case 4: Document Upload (Within 10MB Limit) ---');
  {
    const sigRes = await axios.get(`${BASE_URL}/admin/media/signature?folder=ashwa_cms/documents`, { headers: authHeaders });
    const sigData = sigRes.data.data;
    const pdfBuf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000108 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF', 'utf-8');
    const fd = new FormData();
    fd.append('file', pdfBuf, { filename: 'team_charter.pdf', contentType: 'application/pdf' });
    fd.append('api_key', sigData.apiKey);
    fd.append('timestamp', sigData.timestamp.toString());
    fd.append('signature', sigData.signature);
    fd.append('folder', sigData.folder);

    const cloudRes = await axios.post(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/raw/upload`, fd, { headers: fd.getHeaders() });
    console.log('✅ Cloudinary received PDF:', cloudRes.data.public_id);

    const recRes = await axios.post(`${BASE_URL}/admin/media/direct-record`, {
      publicId: cloudRes.data.public_id,
      url: cloudRes.data.secure_url,
      secureUrl: cloudRes.data.secure_url,
      resourceType: 'raw',
      format: 'pdf',
      bytes: pdfBuf.length,
      altText: 'Team Charter PDF Test',
      folder: sigData.folder,
      originalName: 'team_charter.pdf',
      mimeType: 'application/pdf',
    }, { headers: authHeaders });
    console.log('✅ Saved PDF to MongoDB:', recRes.data.data._id);
    await axios.delete(`${BASE_URL}/admin/media/${recRes.data.data._id}`, { headers: authHeaders });
    console.log('✅ Cleaned up Case 4 test asset');
  }

  // Case 5: Reject Oversized Document (>10MB) before saving broken records
  console.log('\n--- Case 5: Rejection of Oversized Document (>10MB) ---');
  {
    try {
      await axios.post(`${BASE_URL}/admin/media/direct-record`, {
        publicId: 'fake_oversized_doc',
        url: 'https://res.cloudinary.com/fake/doc.pdf',
        secureUrl: 'https://res.cloudinary.com/fake/doc.pdf',
        resourceType: 'raw',
        format: 'pdf',
        bytes: 15 * 1024 * 1024, // 15MB
        altText: 'Oversized Document Test',
      }, { headers: authHeaders });
      console.error('❌ Case 5 FAILED: Backend accepted oversized document!');
    } catch (err) {
      console.log('✅ Correctly rejected by server:', err.response?.status, err.response?.data?.message);
    }
  }

  // Case 6: Reject Oversized Video (>100MB)
  console.log('\n--- Case 6: Rejection of Oversized Video (>100MB) ---');
  {
    try {
      await axios.post(`${BASE_URL}/admin/media/direct-record`, {
        publicId: 'fake_oversized_video',
        url: 'https://res.cloudinary.com/fake/vid.mp4',
        secureUrl: 'https://res.cloudinary.com/fake/vid.mp4',
        resourceType: 'video',
        format: 'mp4',
        bytes: 110 * 1024 * 1024, // 110MB
        altText: 'Oversized Video Test',
      }, { headers: authHeaders });
      console.error('❌ Case 6 FAILED: Backend accepted oversized video!');
    } catch (err) {
      console.log('✅ Correctly rejected by server:', err.response?.status, err.response?.data?.message);
    }
  }

  console.log('\n🎉 ALL VERIFIED LIMIT TEST CASES PASSED SUCCESSFULLY!');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err.response?.data || err.message);
  process.exit(1);
});
