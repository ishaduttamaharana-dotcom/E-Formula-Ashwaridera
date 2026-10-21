// ============================================================
//  scripts/generate-favicons.js
//  Downloads and configures official Ashwa Riders logo favicon assets
//  directly from Cloudinary transformations to ensure exact proportions,
//  crisp resolution, square aspect ratio, and genuine ICO/PNG formats.
// ============================================================

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const publicDir = path.join(__dirname, '../public');

const ASSETS = [
  {
    name: 'favicon.ico',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_48,h_48,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.ico',
  },
  {
    name: 'favicon.png',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_192,h_192,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.png',
  },
  {
    name: 'favicon-48x48.png',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_48,h_48,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.png',
  },
  {
    name: 'favicon-96x96.png',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_96,h_96,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.png',
  },
  {
    name: 'favicon-192x192.png',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_192,h_192,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.png',
  },
  {
    name: 'apple-touch-icon.png',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_180,h_180,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.png',
  },
  {
    name: 'apple-touch-icon-precomposed.png',
    url: 'https://res.cloudinary.com/frjck4sc/image/upload/w_180,h_180,c_pad,b_transparent/v1785320787/092-removebg-preview_jwh6b6.png',
  },
];

async function generate() {
  console.log('🏁 Downloading and configuring official Ashwa Riders favicon assets...');

  for (const asset of ASSETS) {
    try {
      console.log(`  Downloading ${asset.name}...`);
      const res = await axios.get(asset.url, { responseType: 'arraybuffer' });
      const destPath = path.join(publicDir, asset.name);
      fs.writeFileSync(destPath, res.data);
      console.log(`  ✅ Saved ${asset.name} (${res.data.length} bytes, ${res.headers['content-type']})`);
    } catch (err) {
      console.error(`  ❌ Failed to download ${asset.name}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 All favicon assets generated and verified successfully.');
}

generate();
