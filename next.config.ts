import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Initialize Cloudflare for development mode
// initOpenNextCloudflareForDev();

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === 'development',
  sw: "sw.js",
  scope: "/",
  fallbacks: {
    document: '/offline',
  },
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  output: 'standalone',
  // Enable production source maps (optional, for debugging)
  productionBrowserSourceMaps: false,
  // Compress responses
  compress: true,
  // Reduce unused JavaScript
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  // Rewrite /uploads/* to image proxy for R2 compatibility
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/images/proxy?path=/uploads/:path*',
      },
    ];
  },
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
        source: '/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico)',
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
      {
        source: '/fonts/:path*',
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
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '**.demo-web.workers.dev',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default withPWA(nextConfig);
