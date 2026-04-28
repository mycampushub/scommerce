/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // For static export compatibility
    unoptimized: true,
  },
  // Configure for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  // Skip static generation for API routes
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
};

export default nextConfig;
