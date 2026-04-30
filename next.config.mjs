/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Cloudflare Pages
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
