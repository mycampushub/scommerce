import { prisma, isCloudflareEnv as isPrismaCloudflareEnv } from './database';
import {
  getDB as getCloudflareDB,
  getEnv as getCloudflareBindingsEnv,
  isCloudflareEnv as isBindingsCloudflareEnv,
} from './cloudflare-bindings';
import { extractBindingsFromRequest } from './bindings-extractor';

/**
 * Get D1 database from Cloudflare context
 * Falls back to Prisma for local development
 */
export function getDB(request?: Request): any | null {
  try {
    // First, try the request-scoped bindings (most reliable for API routes)
    if (request) {
      const requestEnv = extractBindingsFromRequest(request);
      if (requestEnv && requestEnv['DB']) {
        console.log('[cloudflare.ts] Using Cloudflare D1 database from request');
        return requestEnv['DB'];
      }
    }

    // Second, try the robust Cloudflare bindings access
    const db = getCloudflareDB();
    if (db) {
      console.log('[cloudflare.ts] Using Cloudflare D1 database via global bindings');
      return db;
    }
  } catch (error) {
    console.error('[cloudflare.ts] Error getting D1 binding:', error);
  }

  // Fallback to Prisma for local development
  if (!isPrismaCloudflareEnv()) {
    console.warn('[cloudflare.ts] Local development mode - use Prisma client directly');
    return null;
  }

  console.error('[cloudflare.ts] D1 binding not found and no Prisma fallback available');
  return null;
}

/**
 * Helper to get env from Cloudflare context
 * Falls back to a mock env with Prisma for local development
 */
export function getEnv(request?: Request): any | null {
  try {
    // Strategy 1: Try the request-scoped bindings (most reliable for API routes)
    if (request) {
      const requestEnv = extractBindingsFromRequest(request);
      if (requestEnv && (requestEnv['DB'] || requestEnv['KV'] || requestEnv['BUCKET'])) {
        console.log('[getEnv] Using Cloudflare bindings from request', {
          hasDB: !!requestEnv['DB'],
          hasKV: !!requestEnv['KV'],
          hasBUCKET: !!requestEnv['BUCKET'],
        });
        return requestEnv;
      }
    }

    // Strategy 2: Try the robust Cloudflare bindings access
    const env = getCloudflareBindingsEnv();
    if (env && (env['DB'] || env['KV'] || env['BUCKET'])) {
      console.log('[getEnv] Using Cloudflare bindings (global)', {
        hasDB: !!env['DB'],
        hasKV: !!env['KV'],
        hasBUCKET: !!env['BUCKET'],
      });
      return env;
    }
  } catch (error) {
    console.error('[getEnv] Error getting env:', error);
  }

  // Fallback for local development - return null so repositories use Prisma directly
  if (!isPrismaCloudflareEnv()) {
    console.warn('[getEnv] Local development mode - returning null for Prisma direct usage');
    return null;
  }

  console.error('[getEnv] Env not found and no fallback available');
  return null;
}

/**
 * Export isCloudflareEnv for backward compatibility
 */
export { isBindingsCloudflareEnv as isCloudflareEnv };
