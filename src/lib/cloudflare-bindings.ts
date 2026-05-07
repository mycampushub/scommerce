/**
 * Robust Cloudflare bindings access for OpenNext.js
 * This provides multiple fallback methods to access bindings in different deployment scenarios
 */

let cachedBindings: any = null;

// This is the same Symbol used by @opennextjs/cloudflare
const cloudflareContextSymbol = Symbol.for('__cloudflare-context__');

/**
 * Get Cloudflare bindings with multiple fallback strategies
 */
export function getCloudflareBindings(): any {
  // Return cached bindings if available
  if (cachedBindings) {
    return cachedBindings;
  }

  let bindings: any = null;

  // Strategy 1: Try OpenNext.js Symbol-based approach (most reliable)
  if (typeof globalThis !== 'undefined') {
    try {
      const cloudflareContext = (globalThis as any)[cloudflareContextSymbol];
      
      if (cloudflareContext && cloudflareContext.env) {
        const env = cloudflareContext.env;
        if (env['DB'] || env['KV'] || env['BUCKET']) {
          console.log('[cloudflare-bindings] Found bindings via Symbol.for("__cloudflare-context__")');
          bindings = env;
        }
      }
    } catch (error) {
      console.debug('[cloudflare-bindings] Symbol access error:', error);
    }
  }

  // Strategy 2: Try global Cloudflare workers runtime
  if (!bindings && typeof globalThis !== 'undefined') {
    try {
      // In OpenNext.js on Cloudflare, bindings are often attached to globalThis
      const globalEnv = (globalThis as any).env;
      if (globalEnv && (globalEnv['DB'] || globalEnv['KV'] || globalEnv['BUCKET'])) {
        console.log('[cloudflare-bindings] Found bindings via globalThis.env');
        bindings = globalEnv;
      }

      // Try alternative paths on globalThis
      if (!bindings && (globalThis as any).cloudflare && (globalThis as any).cloudflare.env) {
        const cfEnv = (globalThis as any).cloudflare.env;
        if (cfEnv['DB'] || cfEnv['KV'] || cfEnv['BUCKET']) {
          console.log('[cloudflare-bindings] Found bindings via globalThis.cloudflare.env');
          bindings = cfEnv;
        }
      }
    } catch (error) {
      console.debug('[cloudflare-bindings] globalThis access error:', error);
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

  // Cache bindings
  if (bindings) {
    cachedBindings = bindings;
  }

  return bindings;
}

/**
 * Get D1 database binding
 */
export function getDB(): any {
  const bindings = getCloudflareBindings();
  return bindings?.DB || null;
}

/**
 * Get KV namespace binding
 */
export function getKV(): any {
  const bindings = getCloudflareBindings();
  return bindings?.KV || null;
}

/**
 * Get R2 bucket binding
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
