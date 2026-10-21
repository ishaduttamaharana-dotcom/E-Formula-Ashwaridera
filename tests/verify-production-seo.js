// ============================================================
//  tests/verify-production-seo.js
//  Complete production-ready SEO verification test suite.
//  Validates sitemap.xml, robots.txt, HTML meta tags, OpenGraph,
//  Twitter Cards, Schema.org WebSite & Organization structured data,
//  and live HTTP responses through the Express app.
// ============================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runSeoValidation() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('🏁 E-FORMULA ASHWA RIDERS — PRODUCTION SEO AUDIT SUITE');
  console.log('══════════════════════════════════════════════════════════════\n');

  const publicDir = path.join(__dirname, '../public');

  // ────────────────────────────────────────────────────────────
  //  SUITE 1: ROBOTS.TXT AUDIT
  // ────────────────────────────────────────────────────────────
  console.log('📋 SUITE 1: robots.txt Configuration & Rules');
  const robotsPath = path.join(publicDir, 'robots.txt');
  assert(fs.existsSync(robotsPath), 'robots.txt exists in public directory');

  const robotsContent = fs.readFileSync(robotsPath, 'utf8');
  assert(robotsContent.includes('User-agent: *'), 'robots.txt specifies User-agent: *');
  assert(robotsContent.includes('Disallow: /admin'), 'robots.txt disallows /admin');
  assert(robotsContent.includes('Disallow: /api/'), 'robots.txt disallows /api/');
  assert(robotsContent.includes('Allow: /'), 'robots.txt allows root public pages');
  assert(
    robotsContent.includes('Sitemap: https://www.e-formulaashwariders.in/sitemap.xml'),
    'robots.txt links to authoritative canonical sitemap'
  );
  console.log('');

  // ────────────────────────────────────────────────────────────
  //  SUITE 2: SITEMAP.XML AUDIT
  // ────────────────────────────────────────────────────────────
  console.log('🗺️  SUITE 2: sitemap.xml Canonical Index & Format');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in public directory');

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemapContent.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml has valid XML declaration');
  assert(sitemapContent.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'), 'sitemap.xml uses standard sitemap schema');

  const expectedCanonicalUrls = [
    'https://www.e-formulaashwariders.in/',
    'https://www.e-formulaashwariders.in/about',
    'https://www.e-formulaashwariders.in/car',
    'https://www.e-formulaashwariders.in/team',
    'https://www.e-formulaashwariders.in/achievements',
    'https://www.e-formulaashwariders.in/gallery',
    'https://www.e-formulaashwariders.in/sponsors',
    'https://www.e-formulaashwariders.in/contact',
  ];

  for (const url of expectedCanonicalUrls) {
    assert(sitemapContent.includes(`<loc>${url}</loc>`), `sitemap.xml contains canonical URL: ${url}`);
  }

  assert(!sitemapContent.includes('/admin'), 'sitemap.xml excludes private /admin routes');
  assert(!sitemapContent.includes('/api'), 'sitemap.xml excludes /api endpoints');
  assert(sitemapContent.includes('<lastmod>'), 'sitemap.xml specifies <lastmod> dates');
  assert(sitemapContent.includes('<changefreq>'), 'sitemap.xml specifies <changefreq>');
  assert(sitemapContent.includes('<priority>'), 'sitemap.xml specifies <priority>');
  console.log('');

  // ────────────────────────────────────────────────────────────
  //  SUITE 3: STATIC HTML AUDIT FOR ALL PUBLIC PAGES
  // ────────────────────────────────────────────────────────────
  console.log('📄 SUITE 3: Public HTML Metadata & SEO Directives');
  const pages = [
    { file: 'index.html', canonical: 'https://www.e-formulaashwariders.in/', pageType: 'home' },
    { file: 'about.html', canonical: 'https://www.e-formulaashwariders.in/about', pageType: 'about' },
    { file: 'car.html', canonical: 'https://www.e-formulaashwariders.in/car', pageType: 'car' },
    { file: 'team.html', canonical: 'https://www.e-formulaashwariders.in/team', pageType: 'team' },
    { file: 'achievements.html', canonical: 'https://www.e-formulaashwariders.in/achievements', pageType: 'achievements' },
    { file: 'gallery.html', canonical: 'https://www.e-formulaashwariders.in/gallery', pageType: 'gallery' },
    { file: 'sponsors.html', canonical: 'https://www.e-formulaashwariders.in/sponsors', pageType: 'sponsors' },
    { file: 'contact.html', canonical: 'https://www.e-formulaashwariders.in/contact', pageType: 'contact' },
  ];

  const seenTitles = new Set();
  const seenDescriptions = new Set();

  for (const page of pages) {
    console.log(`\n  Checking page: ${page.file}`);
    const htmlPath = path.join(publicDir, page.file);
    assert(fs.existsSync(htmlPath), `${page.file} exists on disk`);

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Title Tag
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    assert(titleMatch && titleMatch[1].trim().length > 10, `${page.file} has descriptive title: "${titleMatch ? titleMatch[1] : ''}"`);
    if (titleMatch) {
      assert(!seenTitles.has(titleMatch[1]), `${page.file} has unique title`);
      seenTitles.add(titleMatch[1]);
    }

    // Meta Description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    assert(descMatch && descMatch[1].trim().length > 30, `${page.file} has meta description: "${descMatch ? descMatch[1].slice(0, 60) + '...' : ''}"`);
    if (descMatch) {
      assert(!seenDescriptions.has(descMatch[1]), `${page.file} has unique meta description`);
      seenDescriptions.add(descMatch[1]);
    }

    // Canonical Tag
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
    assert(canonicalMatch && canonicalMatch[1] === page.canonical, `${page.file} has matching canonical link: ${page.canonical}`);

    // Robots Tag
    const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["'](.*?)["']/i);
    assert(robotsMatch && robotsMatch[1].includes('index') && robotsMatch[1].includes('follow'), `${page.file} has robots directive "index, follow"`);
    assert(!html.includes('noindex'), `${page.file} does NOT contain noindex tag`);

    // OpenGraph Tags
    assert(html.includes('property="og:title"'), `${page.file} has og:title`);
    assert(html.includes('property="og:description"'), `${page.file} has og:description`);
    assert(html.includes('property="og:url"'), `${page.file} has og:url`);
    assert(html.includes('property="og:image"'), `${page.file} has og:image`);
    assert(html.includes('property="og:type"'), `${page.file} has og:type`);

    // Twitter Card Tags
    assert(html.includes('name="twitter:card"'), `${page.file} has twitter:card`);
    assert(html.includes('name="twitter:title"'), `${page.file} has twitter:title`);
    assert(html.includes('name="twitter:description"'), `${page.file} has twitter:description`);
    assert(html.includes('name="twitter:image"'), `${page.file} has twitter:image`);

    // Schema.org Structured Data
    assert(html.includes('type="application/ld+json"'), `${page.file} has JSON-LD structured data`);

    // Favicon links
    assert(html.includes('href="/favicon.ico"'), `${page.file} links to /favicon.ico`);
    assert(html.includes('href="/favicon.png"'), `${page.file} links to /favicon.png`);
    assert(html.includes('href="/favicon-48x48.png"'), `${page.file} links to /favicon-48x48.png`);
    assert(html.includes('href="/favicon-144x144.png"'), `${page.file} links to /favicon-144x144.png`);
    assert(html.includes('href="/apple-touch-icon.png"'), `${page.file} links to /apple-touch-icon.png`);
  }
  console.log('');

  // ────────────────────────────────────────────────────────────
  //  SUITE 4: STRUCTURED DATA SPECIFIC REQUIREMENTS
  // ────────────────────────────────────────────────────────────
  console.log('🏷️  SUITE 4: WebSite & Organization Structured Data Verification');
  const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert(!!jsonLdMatch, 'Homepage has valid JSON-LD script block');

  if (jsonLdMatch) {
    try {
      const parsedLd = JSON.parse(jsonLdMatch[1]);
      const graph = parsedLd['@graph'] || [parsedLd];

      const webSite = graph.find((item) => item['@type'] === 'WebSite');
      assert(!!webSite, 'Structured data contains @type "WebSite"');
      assert(webSite && webSite.name === 'E-Formula Ashwa Riders', 'WebSite name is "E-Formula Ashwa Riders"');
      assert(webSite && webSite.alternateName === 'Ashwa Riders', 'WebSite alternateName is "Ashwa Riders"');
      assert(webSite && webSite.url === 'https://www.e-formulaashwariders.in/', 'WebSite url is canonical "https://www.e-formulaashwariders.in/"');

      const org = graph.find((item) => item['@type'] === 'Organization');
      assert(!!org, 'Structured data contains @type "Organization"');
      assert(org && org.name === 'E-Formula Ashwa Riders', 'Organization official team name is "E-Formula Ashwa Riders"');
      assert(org && org.alternateName === 'Ashwa Riders', 'Organization alternateName is "Ashwa Riders"');
      assert(org && org.url === 'https://www.e-formulaashwariders.in/', 'Organization url matches canonical domain');
      assert(
        org &&
        (typeof org.logo === 'string' || (org.logo && org.logo.url)) &&
        (org.logo?.url || org.logo).includes('cloudinary.com'),
        'Organization logo URL points to verified public motorsport logo'
      );
      assert(org && org.email === 'eformulaashwariders@gmail.com', 'Organization email is verified official email');
      assert(org && org.telephone === '+91-90961-10224', 'Organization telephone is verified team contact');
      assert(org && Array.isArray(org.sameAs) && org.sameAs.some(u => u.includes('instagram.com/eformula_ashwariders')), 'Organization sameAs contains verified Instagram');
      assert(org && Array.isArray(org.sameAs) && org.sameAs.some(u => u.includes('linkedin.com/company/e-formula-ashwa-riders')), 'Organization sameAs contains verified LinkedIn');
    } catch (e) {
      assert(false, 'JSON-LD parsed without JSON syntax error: ' + e.message);
    }
  }
  console.log('');

  // ────────────────────────────────────────────────────────────
  //  SUITE 5: ADMIN SECURITY & NOINDEX DIRECTIVE
  // ────────────────────────────────────────────────────────────
  console.log('🔒 SUITE 5: Admin Panel Search Engine Blocking');
  const adminHtml = fs.readFileSync(path.join(publicDir, 'admin', 'index.html'), 'utf8');
  assert(adminHtml.includes('noindex'), 'Admin index.html explicitly includes noindex directive');
  assert(adminHtml.includes('nofollow'), 'Admin index.html explicitly includes nofollow directive');
  console.log('');

  // ────────────────────────────────────────────────────────────
  //  SUITE 6: LIVE EXPRESS SERVER & HTTP RESPONSE TESTING
  // ────────────────────────────────────────────────────────────
  console.log('🌐 SUITE 6: Express Server HTTP Response & Header Testing');
  process.env.NODE_ENV = 'production';
  const app = require('../app');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`  Live test server listening on port ${port}`);

  function fetchUrl(pathname) {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}${pathname}`, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });
  }

  try {
    // 1. Robots.txt HTTP
    const robotsRes = await fetchUrl('/robots.txt');
    assert(robotsRes.status === 200, 'GET /robots.txt returns HTTP 200');
    assert(robotsRes.headers['content-type']?.includes('text/plain'), 'GET /robots.txt returns text/plain');
    assert(robotsRes.body.includes('Sitemap:'), 'GET /robots.txt response contains Sitemap header');

    // 2. Sitemap.xml HTTP
    const sitemapRes = await fetchUrl('/sitemap.xml');
    assert(sitemapRes.status === 200, 'GET /sitemap.xml returns HTTP 200');
    assert(sitemapRes.headers['content-type']?.includes('xml'), 'GET /sitemap.xml returns XML Content-Type');
    assert(sitemapRes.body.includes('<loc>https://www.e-formulaashwariders.in/</loc>'), 'GET /sitemap.xml response contains canonical homepage');

    // 3. Homepage HTTP
    const homeRes = await fetchUrl('/');
    assert(homeRes.status === 200, 'GET / returns HTTP 200');
    assert(homeRes.body.includes('<title>E-Formula Ashwa Riders | Formula Student Electric Racing Team</title>'), 'GET / response includes exact title "E-Formula Ashwa Riders | Formula Student Electric Racing Team"');
    assert(homeRes.body.includes('https://www.e-formulaashwariders.in/'), 'GET / response contains canonical tag');
    assert(homeRes.body.includes('name="robots" content="index, follow"'), 'GET / response contains index, follow');
    assert(homeRes.body.includes('content="E-Formula Ashwa Riders"'), 'GET / response contains og:site_name "E-Formula Ashwa Riders"');
    assert(homeRes.body.includes('href="/favicon.ico"'), 'GET / response links to /favicon.ico');
    assert(homeRes.body.includes('href="/favicon-48x48.png"'), 'GET / response links to /favicon-48x48.png');
    assert(homeRes.body.includes('href="/apple-touch-icon.png"'), 'GET / response links to /apple-touch-icon.png');

    // 3b. Favicon HTTP verification
    const favIcoRes = await fetchUrl('/favicon.ico');
    assert(favIcoRes.status === 200, 'GET /favicon.ico returns HTTP 200');

    const favPngRes = await fetchUrl('/favicon.png');
    assert(favPngRes.status === 200, 'GET /favicon.png returns HTTP 200');

    const fav48Res = await fetchUrl('/favicon-48x48.png');
    assert(fav48Res.status === 200, 'GET /favicon-48x48.png returns HTTP 200');

    const fav96Res = await fetchUrl('/favicon-96x96.png');
    assert(fav96Res.status === 200, 'GET /favicon-96x96.png returns HTTP 200');

    const fav144Res = await fetchUrl('/favicon-144x144.png');
    assert(fav144Res.status === 200, 'GET /favicon-144x144.png returns HTTP 200');

    const fav192Res = await fetchUrl('/favicon-192x192.png');
    assert(fav192Res.status === 200, 'GET /favicon-192x192.png returns HTTP 200');

    const appleTouchRes = await fetchUrl('/apple-touch-icon.png');
    assert(appleTouchRes.status === 200, 'GET /apple-touch-icon.png returns HTTP 200');

    // 4. Clean URL routing & SSR SEO injection
    const aboutClean = await fetchUrl('/about');
    assert(aboutClean.status === 200, 'GET /about returns HTTP 200');
    assert(aboutClean.body.includes('<title>About Us — E-Formula Ashwa Riders'), 'GET /about response has About title');
    assert(aboutClean.body.includes('href="https://www.e-formulaashwariders.in/about"'), 'GET /about canonical is https://www.e-formulaashwariders.in/about');

    const carClean = await fetchUrl('/car');
    assert(carClean.status === 200, 'GET /car returns HTTP 200');
    assert(carClean.body.includes('href="https://www.e-formulaashwariders.in/car"'), 'GET /car canonical is https://www.e-formulaashwariders.in/car');

    const teamClean = await fetchUrl('/team');
    assert(teamClean.status === 200, 'GET /team returns HTTP 200');
    assert(teamClean.body.includes('href="https://www.e-formulaashwariders.in/team"'), 'GET /team canonical is https://www.e-formulaashwariders.in/team');

    const achieveClean = await fetchUrl('/achievements');
    assert(achieveClean.status === 200, 'GET /achievements returns HTTP 200');
    assert(achieveClean.body.includes('href="https://www.e-formulaashwariders.in/achievements"'), 'GET /achievements canonical is https://www.e-formulaashwariders.in/achievements');

    const galleryClean = await fetchUrl('/gallery');
    assert(galleryClean.status === 200, 'GET /gallery returns HTTP 200');
    assert(galleryClean.body.includes('href="https://www.e-formulaashwariders.in/gallery"'), 'GET /gallery canonical is https://www.e-formulaashwariders.in/gallery');

    const sponsorsClean = await fetchUrl('/sponsors');
    assert(sponsorsClean.status === 200, 'GET /sponsors returns HTTP 200');
    assert(sponsorsClean.body.includes('href="https://www.e-formulaashwariders.in/sponsors"'), 'GET /sponsors canonical is https://www.e-formulaashwariders.in/sponsors');

    const contactClean = await fetchUrl('/contact');
    assert(contactClean.status === 200, 'GET /contact returns HTTP 200');
    assert(contactClean.body.includes('href="https://www.e-formulaashwariders.in/contact"'), 'GET /contact canonical is https://www.e-formulaashwariders.in/contact');

    // 5. Admin Panel HTTP
    const adminRes = await fetchUrl('/admin');
    assert(adminRes.status === 301 || adminRes.status === 200, 'GET /admin returns HTTP 301 redirect or 200');

    const adminSlashRes = await fetchUrl('/admin/');
    assert(adminSlashRes.status === 200, 'GET /admin/ returns HTTP 200');
    assert(adminSlashRes.body.includes('noindex'), 'GET /admin/ response HTML includes noindex directive');
  } finally {
    server.close();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`🏁 AUDIT RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks > 0) {
    console.error(`❌ ${failedChecks} CHECKS FAILED!`);
    process.exit(1);
  } else {
    console.log(`🎉 ALL ${passedChecks} CHECKS PASSED SUCCESSFULLY! SITE SEO IS PRODUCTION READY.`);
    process.exit(0);
  }
}

runSeoValidation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
