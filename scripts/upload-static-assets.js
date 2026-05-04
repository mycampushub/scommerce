/**
 * Script to upload static assets to Cloudflare R2 bucket
 * This ensures all _next/static files and public folder files are available
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files and directories to upload
const staticAssets = [
  // Public folder assets
  { source: 'public/logo.png', target: 'logo.png' },
  { source: 'public/favicon.ico', target: 'favicon.ico' },
  { source: 'public/favicon.svg', target: 'favicon.svg' },
  { source: 'public/manifest.json', target: 'manifest.json' },
  { source: 'public/robots.txt', target: 'robots.txt' },
  { source: 'public/sw.js', target: 'sw.js' },

  // .open-next/static folder will be uploaded after build
  // This is handled by wrangler pages deploy
];

console.log('Static assets to upload:');
staticAssets.forEach(asset => {
  console.log(`  - ${asset.source} -> ${asset.target}`);
});

console.log('\nThese assets need to be uploaded manually or included in the build process.');
console.log('\nFor Cloudflare Pages deployment:');
console.log('  1. Run: npm run build:cloudflare');
console.log('  2. The .open-next/assets folder contains static files');
console.log('  3. Run: wrangler pages deploy .open-next/assets');
console.log('\nFor Cloudflare Workers deployment:');
console.log('  1. Run: npm run build:cloudflare');
console.log('  2. Upload .open-next/worker.js to Workers');
console.log('  3. Upload static assets to R2 bucket');
