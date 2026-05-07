/**
 * Helper to extract Cloudflare bindings from Request object
 * In Cloudflare Workers/Pages, bindings are attached to the Request object
 */

export function getEnvFromRequest(request: Request): any {
  // Try to get env from the request object
  // In Cloudflare Workers/Pages, env is often attached to the request
  try {
    // @ts-ignore - env might be attached to request by Cloudflare
    if (request.env && (request.env['DB'] || request.env['KV'] || request.env['BUCKET'])) {
      console.log('[getEnvFromRequest] Found bindings on request.env');
      return request.env;
    }

    // @ts-ignore - bindings might be attached to request directly
    if (request.bindings && (request.bindings['DB'] || request.bindings['KV'] || request.bindings['BUCKET'])) {
      console.log('[getEnvFromRequest] Found bindings on request.bindings');
      return request.bindings;
    }

    // @ts-ignore - cloudflare context might be on request
    if (request.cloudflare && request.cloudflare.env) {
      const env = request.cloudflare.env;
      if (env['DB'] || env['KV'] || env['BUCKET']) {
        console.log('[getEnvFromRequest] Found bindings on request.cloudflare.env');
        return env;
      }
    }
  } catch (error) {
    console.debug('[getEnvFromRequest] Could not get env from request:', error);
  }

  return null;
}
