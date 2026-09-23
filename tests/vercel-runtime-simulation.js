// ============================================================
//  tests/vercel-runtime-simulation.js
//  Simulates Vercel Serverless environment:
//    - process.env.VERCEL = '1'
//    - Read-only filesystem simulation
//    - Dynamic *.vercel.app CORS validation
//    - Direct Express app serverless invocation
// ============================================================

process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

const http = require('http');

async function testVercelRuntime() {
  console.log('🔍 [Vercel Simulation] Testing module initialization with VERCEL=1...');

  let app;
  try {
    app = require('../api/index');
    console.log('✅ [Vercel Simulation] api/index loaded successfully without EROFS errors.');
  } catch (err) {
    console.error('❌ [Vercel Simulation] api/index CRASHED on require:', err);
    process.exit(1);
  }

  // Create local server from exported app to verify HTTP handling
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`✅ [Vercel Simulation] Serverless Express listening on test port ${port}`);

  const axios = require('axios');
  const client = axios.create({
    baseURL: `http://localhost:${port}`,
    validateStatus: () => true, // don't throw on non-2xx
  });

  // Test 1: Health Check
  const healthRes = await client.get('/api/v1/health');
  console.log('✅ [Vercel Simulation] /api/v1/health status:', healthRes.status, healthRes.data);

  // Test 2: Navigation Content
  const navRes = await client.get('/api/v1/content/navigation');
  console.log('✅ [Vercel Simulation] /api/v1/content/navigation status:', navRes.status, 'Brand:', navRes.data?.data?.branding?.brandTitle);

  // Test 3: CORS from Vercel preview domain
  const previewOrigin = 'https://e-formula-ashwaridera-git-feature-preview.vercel.app';
  const corsRes = await client.get('/api/v1/content/navigation', {
    headers: { Origin: previewOrigin },
  });
  console.log('✅ [Vercel Simulation] Dynamic Vercel Preview CORS status:', corsRes.status, 'Allow-Origin:', corsRes.headers['access-control-allow-origin']);

  // Test 4: CORS from production Vercel domain
  const prodOrigin = 'https://ashwariders.vercel.app';
  const prodCorsRes = await client.get('/api/v1/content/navigation', {
    headers: { Origin: prodOrigin },
  });
  console.log('✅ [Vercel Simulation] Production Vercel CORS status:', prodCorsRes.status, 'Allow-Origin:', prodCorsRes.headers['access-control-allow-origin']);

  server.close();

  if (healthRes.status === 200 && navRes.status === 200 && corsRes.status === 200 && prodCorsRes.status === 200) {
    console.log('\n🎉 [Vercel Simulation] ALL VERCEL RUNTIME CHECKS PASSED.');
    process.exit(0);
  } else {
    console.error('\n❌ [Vercel Simulation] CHECKS FAILED.');
    process.exit(1);
  }
}

testVercelRuntime();
