/**
 * Robust Cloudflare bindings access for OpenNext.js
 * This provides multiple fallback methods to access bindings in different deployment scenarios
 */

let cachedBindings: any = null;

/**
 * Get Cloudflare bindings with multiple fallback strategies
 */
export function getCloudflareBindings(): any {
  // Return cached bindings if available
  if (cachedBindings) {
    return cachedBindings;
  }

  let bindings: any = null;

  // Strategy 1: Try @opennextjs/cloudflare context
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    if (env && (env['DB'] || env['KV'] || env['BUCKET'])) {
      console.log('[cloudflare-bindings] Found bindings via getCloudflareContext');
      bindings = env;
    }
  } catch (error) {
    console.debug('[cloudflare-bindings] getCloudflareContext not available:', error);
  }

  // Strategy 2: Try global Cloudflare workers runtime (fallback)
  if (!bindings && typeof globalThis !== 'undefined') {
    try {
      // Some Cloudflare runtimes expose bindings through globalThis
      if ((globalThis as any).env && ((globalThis as any).env['DB'] || (globalThis as any).env['KV'] || (globalThis as any).env['BUCKET'])) {
        console.log('[cloudflare-bindings] Found bindings via globalThis.env');
        bindings = (globalThis as any).env;
      }
    } catch (error) {
      console.debug('[cloudflare-bindings] globalThis.env not available:', error);
    }
  }

  // Strategy 3: Try process.env (for some deployment scenarios)
  if (!bindings && typeof process !== 'undefined' && process.env) {
    // Check if bindings are passed through environment
    const hasDB = process.env.CLOUDFLARE_D1_DATABASE;
    const hasKV = process.env.CLOUDFLARE_KV_NAMESPACE;
    const hasBucket = process.env.CLOUDFLARE_R2_BUCKET;

    if (hasDB || hasKV || hasBucket) {
      console.log('[cloudflare-bindings] Found bindings via process.env (limited)');
      bindings = {
        DB: hasDB,
        KV: hasKV,
        BUCKET: hasBucket,
      };
    }
  }

  // Cache the bindings
  if (bindings) {
    cachedBindings = bindings;
  }

  return bindings;
}

/**
 * Get the D1 database binding
 */
export function getDB(): any {
  const bindings = getCloudflareBindings();
  return bindings?.DB || null;
}

/**
 * Get the KV namespace binding
 */
export function getKV(): any {
  const bindings = getCloudflareBindings();
  return bindings?.KV || null;
}

/**
 * Get the R2 bucket binding
 */
export function getR2Bucket(): any {
  const bindings = getCloudflareBindings();
  return bindings?.BUCKET || null;
}

/**
 * Check if running in Cloudflare environment
 */
export function isCloudflareEnv(): boolean {
  // Check for Cloudflare-specific globals
  if (typeof globalThis !== 'undefined') {
    // Workers have Request/Response/Headers constructors that are different from Node
    const isWorkers = typeof (globalThis as any).Request !== 'undefined' &&
                      typeof (globalThis as any).cf !== 'undefined';
    return isWorkers;
  }

  // Check for Cloudflare environment variables
  if (typeof process !== 'undefined' && process.env) {
    return process.env.CF_PAGES === '1' || process.env.CF_WORKERS === '1';
  }

  return false;
}

/**
 * Get all bindings as an Env object (for compatibility with existing code)
 */
export function getEnv(): any {
  const bindings = getCloudflareBindings();

  if (!bindings) {
    console.warn('[cloudflare-bindings] No bindings available');
    return null;
  }

  return bindings;
}

/**
 * Clear cached bindings (useful for testing or hot reload)
 */
export function clearBindingsCache(): void {
  cachedBindings = null;
}
