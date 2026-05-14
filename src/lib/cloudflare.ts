import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma, isCloudflareEnv } from './database';

// Re-export isCloudflareEnv for use in API routes
export { isCloudflareEnv };

/**
 * Safely get Cloudflare context, handling build-time scenarios
 */
async function safelyGetCloudflareContextAsync() {
  try {
    const context = await getCloudflareContext({ async: true });
    console.log('[cloudflare.ts] getCloudflareContext(async: true) result:', {
      hasContext: !!context,
      hasEnv: !!context?.env,
      envKeys: context?.env ? Object.keys(context.env).filter(k => k === 'DB' || k === 'KV' || k === 'BUCKET') : []
    });
    
    // Validate that the context has the expected structure
    if (!context || typeof context !== 'object') {
      console.warn('[cloudflare.ts] Invalid Cloudflare context structure');
      return null;
    }
    if (!context.env || typeof context.env !== 'object') {
      console.warn('[cloudflare.ts] Cloudflare context missing env object');
      return null;
    }
    return context;
  } catch (error: any) {
    const errorMsg = error?.message || '';
    console.error('[cloudflare.ts] Error getting Cloudflare context (async):', errorMsg);
    return null;
  }
}

/**
 * Safely get Cloudflare context, handling build-time scenarios
 */
function safelyGetCloudflareContext() {
  try {
    const context = getCloudflareContext();
    console.log('[cloudflare.ts] getCloudflareContext result:', {
      hasContext: !!context,
      hasEnv: !!context?.env,
      envKeys: context?.env ? Object.keys(context.env).filter(k => k === 'DB' || k === 'KV' || k === 'BUCKET') : []
    });
    
    // Validate that the context has the expected structure
    if (!context || typeof context !== 'object') {
      console.warn('[cloudflare.ts] Invalid Cloudflare context structure');
      return null;
    }
    if (!context.env || typeof context.env !== 'object') {
      console.warn('[cloudflare.ts] Cloudflare context missing env object');
      return null;
    }
    return context;
  } catch (error: any) {
    // If called during static build or in sync mode, return null
    const errorMsg = error?.message || '';
    if (errorMsg.includes('sync mode') ||
        errorMsg.includes('static route') ||
        errorMsg.includes('top level') ||
        errorMsg.includes('initOpenNextCloudflareForDev')) {
      // Silently return null during build or when context isn't initialized
      console.debug('[cloudflare.ts] Context not available:', errorMsg.substring(0, 100));
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
export async function getEnvAsync(_request?: Request): Promise<any | null> {
  // First try async Cloudflare context
  const context = await safelyGetCloudflareContextAsync();
  if (context?.env && (context.env['DB'] || context.env['KV'] || context.env['BUCKET'])) {
    console.log('[cloudflare.ts] Using Cloudflare bindings (async)', {
      hasDB: !!context.env['DB'],
      hasKV: !!context.env['KV'],
      hasBUCKET: !!context.env['BUCKET'],
    });
    return context.env;
  }

  // Fallback to sync context
  return getEnv(_request);
}

/**
 * Helper to get env from Cloudflare context
 * Falls back to a mock env with Prisma for local development
 */
export function getEnv(_request?: Request): any | null {
  // First try Cloudflare bindings regardless of environment detection
  const context = safelyGetCloudflareContext();
  if (context?.env && (context.env['DB'] || context.env['KV'] || context.env['BUCKET'])) {
    console.log('[cloudflare.ts] Using Cloudflare bindings (sync)', {
      hasDB: !!context.env['DB'],
      hasKV: !!context.env['KV'],
      hasBUCKET: !!context.env['BUCKET'],
    });
    return context.env;
  }

  // Then check if we're in local development mode
  if (!isCloudflareEnv()) {
    console.warn('[cloudflare.ts] Local development mode - returning null for Prisma direct usage');
    return null;
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
