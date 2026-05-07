/**
 * Comprehensive Cloudflare bindings extractor for OpenNext.js
 * Checks all possible locations where bindings might be attached
 */

// The Symbol used by OpenNext.js internally
const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__');

/**
 * Extract Cloudflare bindings from Request object using all possible strategies
 * This is the most comprehensive approach to find bindings in OpenNext.js
 */
export function extractBindingsFromRequest(request: Request): any | null {
  if (!request) return null;

  try {
    const r = request as any;

    // Log all keys for debugging (only in development)
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[bindings-extractor] Request keys:', Object.keys(r));
      console.log('[bindings-extractor] Request prototype:', Object.getPrototypeOf(r));
    }

    // Strategy 1: Direct env property (most common in Cloudflare Workers)
    if (r.env) {
      if (r.env.DB || r.env.KV || r.env.BUCKET) {
        console.log('[bindings-extractor] Found bindings on request.env');
        return r.env;
      }
    }

    // Strategy 2: Bindings property (alternative Cloudflare pattern)
    if (r.bindings) {
      if (r.bindings.DB || r.bindings.KV || r.bindings.BUCKET) {
        console.log('[bindings-extractor] Found bindings on request.bindings');
        return r.bindings;
      }
    }

    // Strategy 3: Cloudflare context property
    if (r.cloudflare && r.cloudflare.env) {
      if (r.cloudflare.env.DB || r.cloudflare.env.KV || r.cloudflare.env.BUCKET) {
        console.log('[bindings-extractor] Found bindings on request.cloudflare.env');
        return r.cloudflare.env;
      }
    }

    // Strategy 4: Request context property (used by some frameworks)
    if (r.context && r.context.env) {
      if (r.context.env.DB || r.context.env.KV || r.context.env.BUCKET) {
        console.log('[bindings-extractor] Found bindings on request.context.env');
        return r.context.env;
      }
    }

    // Strategy 5: Try to find properties with binding names
    // Check if the request object has DB, KV, or BUCKET properties directly
    if (r.DB || r.KV || r.BUCKET) {
      console.log('[bindings-extractor] Found bindings directly on request');
      return {
        DB: r.DB,
        KV: r.KV,
        BUCKET: r.BUCKET,
      };
    }

    // Strategy 6: Check Symbol-based context on global scope
    // OpenNext.js uses this Symbol internally, might also attach to request
    if (typeof globalThis !== 'undefined') {
      const globalContext = (globalThis as any)[CLOUDFLARE_CONTEXT_SYMBOL];
      if (globalContext && globalContext.env) {
        const { DB, KV, BUCKET } = globalContext.env;
        if (DB || KV || BUCKET) {
          console.log('[bindings-extractor] Found bindings on globalThis Symbol context');
          return globalContext.env;
        }
      }
    }

    // Strategy 7: Check all enumerable properties for binding-like objects
    for (const key in r) {
      if (key === 'env' || key === 'bindings' || key === 'cloudflare' || key === 'context') {
        continue; // Already checked these
      }
      const value = r[key];
      if (value && typeof value === 'object' && (value.DB || value.KV || value.BUCKET)) {
        console.log(`[bindings-extractor] Found bindings on request.${key}`);
        return value;
      }
    }

    console.warn('[bindings-extractor] No bindings found on request object');
    return null;
  } catch (error) {
    console.error('[bindings-extractor] Error extracting bindings:', error);
    return null;
  }
}

/**
 * Get bindings from global scope with multiple strategies
 */
export function extractBindingsFromGlobal(): any | null {
  try {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    // Strategy 1: OpenNext.js Symbol-based context
    const symbolContext = (globalThis as any)[CLOUDFLARE_CONTEXT_SYMBOL];
    if (symbolContext && symbolContext.env) {
      const { DB, KV, BUCKET } = symbolContext.env;
      if (DB || KV || BUCKET) {
        console.log('[bindings-extractor] Found bindings on global Symbol context');
        return symbolContext.env;
      }
    }

    // Strategy 2: Direct env property
    if ((globalThis as any).env) {
      const env = (globalThis as any).env;
      if (env.DB || env.KV || env.BUCKET) {
        console.log('[bindings-extractor] Found bindings on globalThis.env');
        return env;
      }
    }

    // Strategy 3: Check all global properties for binding-like objects
    for (const key in globalThis) {
      // Skip common globals
      if (
        key === 'window' || key === 'self' || key === 'global' ||
        key === 'document' || key === 'location' || key === 'navigator'
      ) {
        continue;
      }

      try {
        const value = (globalThis as any)[key];
        if (value && typeof value === 'object' && (value.DB || value.KV || value.BUCKET)) {
          console.log(`[bindings-extractor] Found bindings on globalThis.${key}`);
          return value;
        }
      } catch {
        // Ignore errors when accessing properties
      }
    }

    console.log('[bindings-extractor] No bindings found on global scope');
    return null;
  } catch (error) {
    console.error('[bindings-extractor] Error accessing global bindings:', error);
    return null;
  }
}

/**
 * Get env with comprehensive extraction strategy
 * Tries request first, then falls back to global
 */
export function getEnv(request?: Request): any | null {
  // First try request-scoped
  if (request) {
    const bindings = extractBindingsFromRequest(request);
    if (bindings) {
      return bindings;
    }
  }

  // Fallback to global scope
  const globalBindings = extractBindingsFromGlobal();
  if (globalBindings) {
    return globalBindings;
  }

  // Return null to indicate no bindings found
  console.error('[bindings-extractor] No bindings available');
  return null;
}
