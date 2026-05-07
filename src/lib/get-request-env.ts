/**
 * Helper to extract Cloudflare bindings from Request object
 * In Cloudflare Workers/Pages with OpenNext.js, bindings are attached to Request object
 */

export function getEnvFromRequest(request: Request): any {
  // Try to get env from request object
  // In Cloudflare Workers/Pages with OpenNext.js, env is often attached to request
  try {
    const r = request as any;

    console.log('[getEnvFromRequest] Attempting to extract bindings from Request');
    console.log('[getEnvFromRequest] Request keys:', Object.keys(r));

    // Strategy 1: Try request.env (standard Cloudflare Workers)
    if (r.env) {
      console.log('[getEnvFromRequest] Request.env found, keys:', Object.keys(r.env));
      if (r.env['DB'] || r.env['KV'] || r.env['BUCKET']) {
        console.log('[getEnvFromRequest] Found bindings on request.env');
        return r.env;
      }
    }

    // Strategy 2: Try request.bindings (alternative Cloudflare pattern)
    if (r.bindings) {
      console.log('[getEnvFromRequest] Request.bindings found, keys:', Object.keys(r.bindings));
      if (r.bindings['DB'] || r.bindings['KV'] || r.bindings['BUCKET']) {
        console.log('[getEnvFromRequest] Found bindings on request.bindings');
        return r.bindings;
      }
    }

    // Strategy 3: Try request.cloudflare.env (OpenNext.js pattern)
    if (r.cloudflare && r.cloudflare.env) {
      console.log('[getEnvFromRequest] Request.cloudflare.env found, keys:', Object.keys(r.cloudflare.env));
      const env = r.cloudflare.env;
      if (env['DB'] || env['KV'] || env['BUCKET']) {
        console.log('[getEnvFromRequest] Found bindings on request.cloudflare.env');
        return env;
      }
    }

    // Strategy 4: Try request.context.env (Next.js App Router pattern)
    if (r.context && r.context.env) {
      console.log('[getEnvFromRequest] Request.context.env found, keys:', Object.keys(r.context.env));
      const env = r.context.env;
      if (env['DB'] || env['KV'] || env['BUCKET']) {
        console.log('[getEnvFromRequest] Found bindings on request.context.env');
        return env;
      }
    }

    // Strategy 5: Try request.getEnv() (if available)
    if (typeof r.getEnv === 'function') {
      console.log('[getEnvFromRequest] Request.getEnv() function found, calling...');
      const env = r.getEnv();
      if (env && (env['DB'] || env['KV'] || env['BUCKET'])) {
        console.log('[getEnvFromRequest] Found bindings via request.getEnv()');
        return env;
      }
    }

    // Strategy 6: Try global bindings as fallback
    if (typeof globalThis !== 'undefined' && (globalThis as any).env) {
      console.log('[getEnvFromRequest] globalThis.env found, keys:', Object.keys((globalThis as any).env));
      const globalEnv = (globalThis as any).env;
      if (globalEnv['DB'] || globalEnv['KV'] || globalEnv['BUCKET']) {
        console.log('[getEnvFromRequest] Found bindings on globalThis.env');
        return globalEnv;
      }
    }

    console.log('[getEnvFromRequest] No bindings found on request object');
  } catch (error) {
    console.error('[getEnvFromRequest] Error extracting env from request:', error);
  }

  return null;
}
