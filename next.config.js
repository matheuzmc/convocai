/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    // As configurações experimentais removidas por compatibilidade com a Vercel
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      }
    ],
  },
};

module.exports = nextConfig; 