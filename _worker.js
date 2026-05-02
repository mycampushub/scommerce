/**
 * Cloudflare Workers entry point for SCommerce
 * Handles both Next.js requests and static assets
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Serve static assets from public folder
    if (
      pathname === '/favicon.ico' ||
      pathname === '/favicon.svg' ||
      pathname === '/logo.svg' ||
      pathname === '/manifest.json' ||
      pathname === '/robots.txt' ||
      pathname === '/sw.js' ||
      pathname.startsWith('/_next/static/media/') ||
      pathname.startsWith('/_next/static/css/') ||
      pathname.startsWith('/_next/static/chunks/')
    ) {
      // Try to serve from R2 bucket first
      try {
        const object = await env.BUCKET.get(pathname.substring(1) || pathname);
        if (object) {
          const headers = new Headers();

          // Set appropriate content type
          const ext = pathname.split('.').pop();
          const contentTypes = {
            'css': 'text/css',
            'js': 'application/javascript',
            'svg': 'image/svg+xml',
            'ico': 'image/x-icon',
            'json': 'application/json',
            'txt': 'text/plain',
            'woff': 'font/woff',
            'woff2': 'font/woff2',
            'ttf': 'font/ttf',
            'eot': 'application/vnd.ms-fontobject',
          };

          headers.set('Content-Type', contentTypes[ext] || 'application/octet-stream');

          // Cache headers
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');

          return new Response(object.body, { headers });
        }
      } catch (error) {
        console.log('R2 fetch error:', error);
      }
    }

    // Import and delegate to OpenNext worker for Next.js requests
    try {
      const worker = await import('./.open-next/worker.js');
      return worker.default.fetch(request, env, ctx);
    } catch (error) {
      console.error('OpenNext worker error:', error);

      // Fallback: return HTML response
      if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
        return new Response('Asset not found', { status: 404 });
      }

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Loading...</title>
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui;">
            <div>
              <h1>Loading Application...</h1>
              <p>If this page doesn't load, please refresh.</p>
            </div>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      });
    }
  }
};
