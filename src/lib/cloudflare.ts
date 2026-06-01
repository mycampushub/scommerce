import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Check if we're running in Cloudflare environment
 * Returns true if Cloudflare bindings are available
 */
export function isCloudflareEnv(): boolean {
  // Check if we're in a Cloudflare environment by checking for specific globals
  // In build time or local development, return false
  if (typeof window !== 'undefined') {
    // Client-side - not a Cloudflare environment
    return false;
  }
  // Server-side - assume Cloudflare if we have access to env bindings
  // The actual check will be done by trying to get the context
  return true;
}

/**
 * Safely get Cloudflare context, handling build-time scenarios
 * Always uses async mode to avoid build errors
 */
async function safelyGetCloudflareContext() {
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
    // Silently return null during build or when context isn't initialized
    if (errorMsg.includes('sync mode') ||
        errorMsg.includes('static route') ||
        errorMsg.includes('top level') ||
        errorMsg.includes('initOpenNextCloudflareForDev')) {
      console.debug('[cloudflare.ts] Context not available:', errorMsg.substring(0, 100));
      return null;
    }
    console.error('[cloudflare.ts] Error getting Cloudflare context:', errorMsg);
    return null;
  }
}

/**
 * Get D1 database from Cloudflare context
 * Falls back to Prisma for local development
 * Must be called as async to avoid build errors
 */
export async function getDB(_request?: Request): Promise<any | null> {
  // First, try Cloudflare D1
  const context = await safelyGetCloudflareContext();
  if (context?.env && 'DB' in context.env) {
    console.log('[cloudflare.ts] Using Cloudflare D1 database');
    return (context.env as any)['DB'];
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
  // Try Cloudflare bindings
  const context = await safelyGetCloudflareContext();
  if (context?.env) {
    const env = context.env as any;
    if (env['DB'] || env['KV'] || env['BUCKET']) {
      console.log('[cloudflare.ts] Using Cloudflare bindings', {
        hasDB: !!env['DB'],
        hasKV: !!env['KV'],
        hasBUCKET: !!env['BUCKET'],
      });
      return env;
    }
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
 * Helper to get env from Cloudflare context
 * Falls back to a mock env with Prisma for local development
 * This is now an alias for getEnvAsync to ensure async mode is always used
 */
export async function getEnv(_request?: Request): Promise<any | null> {
  return getEnvAsync(_request);
}

/**
 * Get environment variable from Cloudflare or process.env
 * Cloudflare Workers/Pages store env vars in the cloudflare context
 */
export async function getEnvVar(key: string): Promise<string | undefined> {
  // Try Cloudflare env context first
  const context = await safelyGetCloudflareContext();
  if (context?.env) {
    const env = context.env as any;
    if (key in env) {
      return env[key];
    }
  }

  // Fallback to process.env
  return process.env[key];
}
