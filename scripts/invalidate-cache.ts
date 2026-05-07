/**
 * Cache Invalidation Utility
 *
 * This script helps bust all caches when cache version changes.
 * Run this after updating NEXT_PUBLIC_CACHE_VERSION in your environment.
 *
 * Usage:
 *   bun scripts/invalidate-cache.ts
 *   bun scripts/invalidate-cache.ts --all
 *   bun scripts/invalidate-cache.ts --cdn
 *   bun scripts/invalidate-cache.ts --service-worker
 */

import { CACHE_VERSION } from '../src/lib/cache-version';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message: string, color: keyof typeof colors = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, 'green');
}

function error(message: string) {
  log(`✗ ${message}`, 'red');
}

function info(message: string) {
  log(`ℹ ${message}`, 'blue');
}

function warn(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

/**
 * Display cache version information
 */
function displayCacheVersion() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  Cache Version Information', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  log(`Current Version: ${CACHE_VERSION}`, 'white');
  log(`Version Number: ${CACHE_VERSION.replace(/\./g, '')}`, 'white');

  log('\nCache Layers:', 'cyan');
  log('  • CDN Cache (Cloudflare)', 'white');
  log('  • Service Worker Cache', 'white');
  log('  • API Response Cache', 'white');
  log('  • React Query Cache', 'white');

  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

/**
 * Bust CDN cache
 * For Cloudflare, this requires using their API or dashboard
 */
function bustCDNCache() {
  info('Busting CDN Cache...');
  info('To purge Cloudflare CDN cache:');
  log('  1. Go to Cloudflare Dashboard > Caching > Purge Everything', 'yellow');
  log('  2. Or use Cloudflare API:', 'yellow');
  log(`     curl -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/purge_cache" \\`, 'white');
  log(`       -H "Authorization: Bearer <API_TOKEN>" \\`, 'white');
  log(`       -H "Content-Type: application/json" \\`, 'white');
  log(`       -d '{"purge_everything":true}'`, 'white');
  log('\n  Or add ?v=<VERSION_NUMBER> to URLs to bypass CDN cache', 'yellow');
}

/**
 * Bust service worker cache
 */
function bustServiceWorkerCache() {
  info('Busting Service Worker Cache...');
  log('  Service worker caches will be automatically cleared when:', 'white');
  log('  1. User refreshes the page', 'white');
  log('  2. New service worker version is activated', 'white');
  log('  3. clearOldVersionCaches() is called in browser', 'white');
  log('\n  To manually clear SW cache:', 'yellow');
  log('  1. Open browser DevTools > Application > Service Workers', 'white');
  log('  2. Click "Unregister" or "Clear storage"', 'white');
  log('  3. Refresh the page', 'white');
}

/**
 * Bust React Query cache
 */
function bustReactQueryCache() {
  info('Busting React Query Cache...');
  log('  React Query cache is automatically cleared when:', 'white');
  log('  1. Cache version changes in localStorage', 'white');
  log('  2. User refreshes the page', 'white');
  log('  3. queryClient.clear() is called', 'white');
  log('\n  To manually clear RQ cache in browser:', 'yellow');
  log('  1. Open browser DevTools > Console', 'white');
  log('  2. Run: localStorage.clear()', 'white');
  log('  3. Refresh the page', 'white');
}

/**
 * Bust all caches
 */
function bustAllCaches() {
  info('Busting ALL Caches...\n');
  bustCDNCache();
  log('');
  bustServiceWorkerCache();
  log('');
  bustReactQueryCache();
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  displayCacheVersion();

  if (!command || command === '--all' || command === '-a') {
    bustAllCaches();
  } else if (command === '--cdn' || command === '-c') {
    bustCDNCache();
  } else if (command === '--service-worker' || command === '-s') {
    bustServiceWorkerCache();
  } else if (command === '--react-query' || command === '-r') {
    bustReactQueryCache();
  } else if (command === '--help' || command === '-h') {
    log('\nUsage:', 'cyan');
    log('  bun scripts/invalidate-cache.ts [options]\n', 'white');
    log('Options:', 'cyan');
    log('  --all, -a              Bust all caches (default)', 'white');
    log('  --cdn, -c              Bust CDN cache only', 'white');
    log('  --service-worker, -s    Bust service worker cache only', 'white');
    log('  --react-query, -r       Bust React Query cache only', 'white');
    log('  --help, -h             Show this help message\n', 'white');
  } else {
    error(`Unknown option: ${command}`);
    log('Use --help for usage information\n', 'yellow');
    process.exit(1);
  }

  success('\nCache invalidation instructions provided above.');
  log('Follow the steps for each cache layer you want to bust.\n', 'cyan');
}

// Run main function
main();
