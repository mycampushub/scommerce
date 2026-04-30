import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Get D1 database from Cloudflare context
 * Uses OpenNext's getCloudflareContext for proper binding access
 */
export function getDB(_request?: Request): D1Database | null {
  try {
    const { env } = getCloudflareContext();
    if (env.DB) {
      return env.DB;
    }
  } catch (error) {
    console.error('[cloudflare.ts] Error getting D1 binding:', error);
  }

  console.error('[cloudflare.ts] D1 binding not found in env');
  return null;
}

/**
 * Helper to get env from Cloudflare context
 * Uses OpenNext's getCloudflareContext for proper binding access
 */
export function getEnv(_request?: Request): any | null {
  try {
    const { env } = getCloudflareContext();
    if (env.DB || env.KV || env.BUCKET) {
      return env;
    }
  } catch (error) {
    console.error('[cloudflare.ts] Error getting env:', error);
  }

  console.error('[cloudflare.ts] Env not found or bindings not available');
  return null;
}
