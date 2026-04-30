/**
 * Cloudflare Pages function for OpenNext
 * This wraps the OpenNext worker.js for Pages deployment
 */

// Import the OpenNext worker (relative to .open-next/ which is deployed)
export default {
  async fetch(request, env, ctx) {
    // Import and use the OpenNext worker
    const worker = await import('../.open-next/worker.js');
    return worker.default.fetch(request, env, ctx);
  }
}
