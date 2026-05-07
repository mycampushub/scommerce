#!/usr/bin/env bun
/**
 * Cache Warming Script for SCommerce
 * 
 * This script pre-warms frequently accessed pages to improve cache hit rates
 * for the first user visit after deployment.
 * 
 * Usage:
 *   bun run warm-cache
 * 
 * Environment Variables:
 *   BASE_URL - Base URL of the application (default: http://localhost:3000)
 *   WARMING_MODE - 'production' or 'development' (default: production)
 *   BATCH_SIZE - Number of concurrent requests (default: 5)
 *   BATCH_DELAY_MS - Delay between batches in milliseconds (default: 1000)
 */

interface WarmResult {
  url: string;
  status: number | null;
  cacheStatus: string | null;
  duration: number;
  success: boolean;
  error?: string;
}

interface WarmSummary {
  total: number;
  successful: number;
  failed: number;
  totalDuration: number;
  cacheHits: number;
  cacheMisses: number;
  errors: Array<{ url: string; error: string }>;
}

// Configuration
const CONFIG = {
  BASE_URL: process.env.BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '5', 10),
  BATCH_DELAY_MS: parseInt(process.env.BATCH_DELAY_MS || '1000', 10),
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
  MODE: process.env.WARMING_MODE || 'production',
};

// Page priorities for cache warming
const PAGES_TO_WARM = {
  // High Priority: Homepage, categories, top content
  high: [
    '/',
    '/api/banners',
    '/api/stories',
    '/api/promotions',
    '/api/reels',
    '/api/categories',
    '/api/settings',
  ],

  // Medium Priority: Products API, featured content
  medium: [
    '/api/products?featured=true',
    '/api/products?sale=true',
    '/api/products?new=true',
    '/api/products?trending=true',
    '/api/products?limit=20',
  ],

  // Low Priority: Individual category pages and popular products
  low: [
    '/collections/saree',
    '/collections/kurtas',
    '/collections/lehengas',
    '/collections/gowns',
    '/collections/tops',
    '/collections/salwar',
    '/collections/menswear',
  ],
};

// Popular product slugs to warm (can be extended or fetched from database)
const POPULAR_PRODUCTS: string[] = [
  // Add your most popular product slugs here
  // Example: '/product/elegant-silk-saree-123',
];

// Logging utilities
const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },
  success: (message: string, ...args: unknown[]) => {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
};

/**
 * Warm a single URL by making a GET request
 */
async function warmUrl(url: string): Promise<WarmResult> {
  const startTime = Date.now();
  const fullUrl = url.startsWith('http') ? url : `${CONFIG.BASE_URL}${url}`;

  logger.info(`Warming: ${fullUrl}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SCommerce-Cache-Warmer/1.0',
        'Accept': 'application/json, text/html, */*',
        'Cache-Control': 'max-age=0', // Force cache check
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    const cacheStatus = response.headers.get('x-cache-status') || 
                        response.headers.get('cf-cache-status') || 
                        'UNKNOWN';

    return {
      url: fullUrl,
      status: response.status,
      cacheStatus,
      duration,
      success: response.ok,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      url: fullUrl,
      status: null,
      cacheStatus: null,
      duration,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Warm a batch of URLs concurrently
 */
async function warmBatch(urls: string[]): Promise<WarmResult[]> {
  logger.info(`Warming batch of ${urls.length} URLs...`);

  const results = await Promise.all(urls.map(url => warmUrl(url)));

  results.forEach(result => {
    if (result.success) {
      const cacheInfo = result.cacheStatus ? ` [Cache: ${result.cacheStatus}]` : '';
      logger.success(
        `✓ ${result.url} - ${result.status} - ${result.duration}ms${cacheInfo}`
      );
    } else {
      logger.error(
        `✗ ${result.url} - ${result.error || 'Failed'} - ${result.duration}ms`
      );
    }
  });

  return results;
}

/**
 * Warm all URLs with batching and delays
 */
async function warmAllUrls(): Promise<WarmSummary> {
  logger.info('Starting cache warming...');
  logger.info(`Base URL: ${CONFIG.BASE_URL}`);
  logger.info(`Batch Size: ${CONFIG.BATCH_SIZE}`);
  logger.info(`Batch Delay: ${CONFIG.BATCH_DELAY_MS}ms`);

  const allResults: WarmResult[] = [];
  const allUrls = [
    ...PAGES_TO_WARM.high,
    ...PAGES_TO_WARM.medium,
    ...PAGES_TO_WARM.low,
    ...POPULAR_PRODUCTS,
  ];

  logger.info(`Total URLs to warm: ${allUrls.length}`);

  // Warm by priority with labels
  const priorities = [
    { name: 'High Priority', urls: PAGES_TO_WARM.high },
    { name: 'Medium Priority', urls: PAGES_TO_WARM.medium },
    { name: 'Low Priority', urls: [...PAGES_TO_WARM.low, ...POPULAR_PRODUCTS] },
  ];

  for (const priority of priorities) {
    if (priority.urls.length === 0) continue;

    logger.info(`\n${'='.repeat(50)}`);
    logger.info(`Warming ${priority.name} (${priority.urls.length} URLs)`);
    logger.info(`${'='.repeat(50)}\n`);

    for (let i = 0; i < priority.urls.length; i += CONFIG.BATCH_SIZE) {
      const batch = priority.urls.slice(i, i + CONFIG.BATCH_SIZE);
      const results = await warmBatch(batch);
      allResults.push(...results);

      // Add delay between batches (except after the last batch)
      if (i + CONFIG.BATCH_SIZE < priority.urls.length) {
        logger.info(`Waiting ${CONFIG.BATCH_DELAY_MS}ms before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY_MS));
      }
    }

    logger.info('');
  }

  // Calculate summary
  const summary: WarmSummary = {
    total: allResults.length,
    successful: allResults.filter(r => r.success).length,
    failed: allResults.filter(r => !r.success).length,
    totalDuration: allResults.reduce((sum, r) => sum + r.duration, 0),
    cacheHits: allResults.filter(r => r.cacheStatus === 'HIT').length,
    cacheMisses: allResults.filter(r => r.cacheStatus === 'MISS').length,
    errors: allResults
      .filter(r => !r.success)
      .map(r => ({ url: r.url, error: r.error || 'Unknown error' })),
  };

  return summary;
}

/**
 * Print warming summary
 */
function printSummary(summary: WarmSummary): void {
  logger.info(`\n${'='.repeat(60)}`);
  logger.info('CACHE WARMING SUMMARY');
  logger.info(`${'='.repeat(60)}\n`);

  logger.info(`Total URLs: ${summary.total}`);
  logger.info(`Successful: ${summary.successful} (${((summary.successful / summary.total) * 100).toFixed(1)}%)`);
  logger.info(`Failed: ${summary.failed} (${((summary.failed / summary.total) * 100).toFixed(1)}%)`);
  logger.info(`Total Duration: ${summary.totalDuration}ms`);
  logger.info(`Average Duration: ${(summary.totalDuration / summary.total).toFixed(0)}ms per URL`);
  
  if (summary.cacheHits > 0 || summary.cacheMisses > 0) {
    logger.info(`Cache Hits: ${summary.cacheHits}`);
    logger.info(`Cache Misses: ${summary.cacheMisses}`);
  }

  if (summary.errors.length > 0) {
    logger.info(`\nFailed URLs:`);
    summary.errors.forEach(({ url, error }) => {
      logger.error(`  - ${url}: ${error}`);
    });
  }

  logger.info(`\n${'='.repeat(60)}\n`);

  if (summary.failed === 0) {
    logger.success('✓ All URLs warmed successfully!');
  } else {
    logger.warn(`⚠ ${summary.failed} URL(s) failed to warm`);
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    const summary = await warmAllUrls();
    printSummary(summary);

    const totalDuration = Date.now() - startTime;
    logger.info(`Total warming time: ${totalDuration}ms`);

    // Exit with error code if any warming failed
    if (summary.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error('Fatal error during cache warming:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export { warmUrl, warmBatch, warmAllUrls, CONFIG, PAGES_TO_WARM };
