/**
 * Helper to extract Cloudflare bindings from Request object
 * In Cloudflare Workers/Pages, bindings are attached to Request object
 */

export function getEnvFromRequest(request: Request): any {
  // Try to get env from request object
  // In Cloudflare Workers/Pages, env is often attached to request
  try {
    // TypeScript doesn't know about Cloudflare's extended Request type
    // So we need to cast to any to access the env property
    if ((request as any).env && ((request as any).env['DB'] || (request as any).env['KV'] || (request as any).env['BUCKET'])) {
      console.log('[getEnvFromRequest] Found bindings on request.env');
      return (request as any).env;
    }

    // bindings might be attached to request directly
    if ((request as any).bindings && ((request as any).bindings['DB'] || (request as any).bindings['KV'] || (request as any).bindings['BUCKET'])) {
      console.log('[getEnvFromRequest] Found bindings on request.bindings');
      return (request as any).bindings;
    }

    // cloudflare context might be on request
    if ((request as any).cloudflare && (request as any).cloudflare.env) {
      const env = (request as any).cloudflare.env;
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
