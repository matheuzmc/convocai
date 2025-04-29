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
      },
      {
        protocol: 'https',
        hostname: 'zgukoxgknqmakqvdlayq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'zgukoxgknqmakqvdlayq.supabase.co',
        port: '',
        pathname: '/storage/v1/render/image/public/**',
      },
      {
        protocol: 'https',
        hostname: 'zcjmpmsrtyfpzculvujz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'zcjmpmsrtyfpzculvujz.supabase.co',
        port: '',
        pathname: '/storage/v1/render/image/public/**',
      },
    ],
  },
};

module.exports = nextConfig; 