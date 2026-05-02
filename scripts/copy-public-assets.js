#!/usr/bin/env node

/**
 * Post-build script to copy public folder assets to .open-next/assets
 * This ensures static assets are included in Cloudflare deployment
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'public');
const targetDir = path.join(__dirname, '..', '.open-next', 'assets');

console.log('Copying public folder assets to .open-next/assets...\n');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✓ Created .open-next/assets directory');
}

// Files to copy
const filesToCopy = [
  'favicon.ico',
  'favicon.svg',
  'logo.svg',
  'manifest.json',
  'robots.txt',
  'sw.js'
];

// Copy each file
let copied = 0;
let skipped = 0;

filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const targetPath = path.join(targetDir, file);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`  ✓ Copied: ${file}`);
    copied++;
  } else {
    console.log(`  ✗ Skipped (not found): ${file}`);
    skipped++;
  }
});

console.log(`\n✓ Copied ${copied} file(s), ${skipped} skipped`);
console.log(`\nAssets are now in: ${targetDir}`);
