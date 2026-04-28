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
  // Next.js 15: moved serverExternalPackages out of experimental
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
