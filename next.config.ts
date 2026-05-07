import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

// Cache version - increment this to bust all caches
const CACHE_VERSION = process.env.NEXT_PUBLIC_CACHE_VERSION || '1.0.0';
const CACHE_VERSION_NUMBER = CACHE_VERSION.replace(/\./g, '');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  
  // CDN optimization headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Vary',
            value: 'Accept-Encoding, Cookie, Authorization',
          },
        ],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Image optimization for CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  sw: "service-worker-custom.js",
  runtimeCaching: [
    {
      urlPattern: /\.(?:js|css|html|json)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: `static-resources-v${CACHE_VERSION_NUMBER}`,
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: `images-cache-v${CACHE_VERSION_NUMBER}`,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https?.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: `network-first-cache-v${CACHE_VERSION_NUMBER}`,
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
  // Add these options for better Cloudflare compatibility
  buildExcludes: [/middleware-manifest\.json$/],
});

export default withPWA(nextConfig);
