/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization - required for Cloudflare Pages
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
