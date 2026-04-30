/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages compatibility - next-on-pages handles the build
  reactStrictMode: true,
  images: {
    // For static export compatibility
    unoptimized: true,
  },
};

export default nextConfig;
