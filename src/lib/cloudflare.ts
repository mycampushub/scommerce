import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma, isCloudflareEnv } from './database';

// Re-export isCloudflareEnv for use in API routes
export { isCloudflareEnv };

/**
 * Safely get Cloudflare context, handling build-time scenarios
 */
function safelyGetCloudflareContext() {
  try {
    return getCloudflareContext();
  } catch (error: any) {
    // If called during static build or in sync mode, return null
    const errorMsg = error?.message || '';
    if (errorMsg.includes('sync mode') || errorMsg.includes('static route') || errorMsg.includes('top level')) {
      // Silently return null during build
      return null;
    }
    // Log other errors but still return null
    console.error('[cloudflare.ts] Error getting Cloudflare context:', error);
    return null;
  }
}

/**
 * Get D1 database from Cloudflare context
 * Falls back to Prisma for local development
 */
export function getDB(_request?: Request): any | null {
  // First, try Cloudflare D1
  const context = safelyGetCloudflareContext();
  if (context?.env?.['DB']) {
    console.log('[cloudflare.ts] Using Cloudflare D1 database');
    return context.env['DB'];
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
  const context = safelyGetCloudflareContext();
  if (context?.env && (context.env['DB'] || context.env['KV'] || context.env['BUCKET'])) {
    console.log('[cloudflare.ts] Using Cloudflare bindings', {
      hasDB: !!context.env['DB'],
      hasKV: !!context.env['KV'],
      hasBUCKET: !!context.env['BUCKET'],
    });
    return context.env;
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
  const context = safelyGetCloudflareContext();
  if (context?.env && key in context.env) {
    return context.env[key];
  }

  // Fallback to process.env
  return process.env[key];
}
