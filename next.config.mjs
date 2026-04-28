/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // For Cloudflare Pages compatibility
    unoptimized: true,
  },
  // Configure for Cloudflare Pages - output handled by @cloudflare/next-on-pages
  // Do NOT use 'export' as it conflicts with API routes
  trailingSlash: true,
  // Next.js 15: moved serverExternalPackages out of experimental
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
