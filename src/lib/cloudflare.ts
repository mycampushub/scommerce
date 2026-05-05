import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma, isCloudflareEnv } from './database';

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
    console.warn('[cloudflare.ts] Using Prisma client for local development');
    return prisma as any;
  }

  console.error('[cloudflare.ts] D1 binding not found and no Prisma fallback available');
  return null;
}

/**
 * Helper to get env from Cloudflare context
 * Falls back to a mock env with Prisma for local development
 */
export function getEnv(_request?: Request): any | null {
  try {
    // Try Cloudflare bindings first
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

  // Fallback for local development
  if (!isCloudflareEnv()) {
    console.warn('[cloudflare.ts] Creating mock env with Prisma for local development');
    return {
      DB: prisma as any,
      KV: null,
      BUCKET: null,
    };
  }

  console.error('[cloudflare.ts] Env not found and no fallback available');
  return null;
}
