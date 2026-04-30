/**
 * Cloudflare Pages _worker.js entry point
 * Wraps OpenNext worker for Pages deployment
 */

export default {
  async fetch(request, env, ctx) {
    // Import and delegate to OpenNext worker
    const worker = await import('./.open-next/worker.js');
    return worker.default.fetch(request, env, ctx);
  }
}
