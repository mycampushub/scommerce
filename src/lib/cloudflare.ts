import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma, isCloudflareEnv } from './database';

// Re-export isCloudflareEnv for use in API routes
export { isCloudflareEnv };

/**
 * Get D1 database from Cloudflare context
 * Falls back to Prisma for local development
 */
export function getDB(_request?: Request): any | null {
  try {
    // First, try Cloudflare D1
    const { env } = getCloudflareContext();
    if (env && env['DB']) {
      console.log('[cloudflare.ts] Using Cloudflare D1 database');
      return env['DB'];
    }
  } catch (error) {
    console.error('[cloudflare.ts] Error getting D1 binding:', error);
  }

  // Fallback to Prisma for local development
  if (!isCloudflareEnv()) {
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
export function getEnv(_request?: Request): any | null {
  // First check if we're in local development mode
  if (!isCloudflareEnv()) {
    console.warn('[cloudflare.ts] Local development mode - returning null for Prisma direct usage');
    return null;
  }

  // Then try Cloudflare bindings
  try {
    const { env } = getCloudflareContext();
    if (env && (env['DB'] || env['KV'] || env['BUCKET'])) {
      console.log('[cloudflare.ts] Using Cloudflare bindings', {
        hasDB: !!env['DB'],
        hasKV: !!env['KV'],
        hasBUCKET: !!env['BUCKET'],
      });
      return env;
    }
  } catch (error) {
    console.error('[cloudflare.ts] Error getting env:', error);
  }

  console.error('[cloudflare.ts] Env not found and no fallback available');
  return null;
}

/**
 * Get environment variable from Cloudflare or process.env
 * Cloudflare Workers/Pages store env vars in the cloudflare context
 */
export function getEnvVar(key: string): string | undefined {
  // Try Cloudflare env context first
  try {
    const { env } = getCloudflareContext();
    if (env && key in env) {
      return env[key];
    }
  } catch (error) {
    // Ignore errors
  }

  // Fallback to process.env
  return process.env[key];
}
