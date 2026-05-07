/**
 * OpenNext.js Cloudflare bindings access
 * In OpenNext.js on Cloudflare Pages, bindings are accessed via a global Symbol
 */

// This is the same Symbol used by @opennextjs/cloudflare
const cloudflareContextSymbol = Symbol.for('__cloudflare-context__');

/**
 * Get Cloudflare bindings using OpenNext.js's Symbol-based approach
 * This is the official way OpenNext.js exposes bindings
 */
export function getOpenNextBindings(): any | null {
  try {
    // Access the Cloudflare context using the Symbol
    if (typeof globalThis !== 'undefined') {
      const cloudflareContext = (globalThis as any)[cloudflareContextSymbol];
      
      if (cloudflareContext && cloudflareContext.env) {
        const { DB, KV, BUCKET } = cloudflareContext.env;
        
        if (DB || KV || BUCKET) {
          console.log('[opennext-bindings] Found bindings via Symbol.for("__cloudflare-context__")', {
            hasDB: !!DB,
            hasKV: !!KV,
            hasBUCKET: !!BUCKET,
          });
          return cloudflareContext.env;
        }
      }
    }

    console.log('[opennext-bindings] No OpenNext.js Cloudflare context found');
    return null;
  } catch (error) {
    console.error('[opennext-bindings] Error accessing OpenNext.js Cloudflare context:', error);
    return null;
  }
}

/**
 * Try async version of getCloudflareContext for development
 */
export async function getOpenNextBindingsAsync(): Promise<any | null> {
  try {
    // Try to get the getCloudflareContext function
    // This is only available in development with Wrangler
    if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'nodejs') {
      // We can't import @opennextjs/cloudflare here directly due to bundling issues
      // The async version is primarily for development with Wrangler
      return getOpenNextBindings();
    }
    
    return getOpenNextBindings();
  } catch (error) {
    console.error('[opennext-bindings] Error in async binding access:', error);
    return null;
  }
}
