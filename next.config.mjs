import withPWA from 'next-pwa';

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Desabilitar PWA em dev para evitar conflitos com HMR/Turbopack
  // Outras opções do next-pwa podem ser adicionadas aqui
};

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

// Note: Quando usamos .mjs, precisamos usar export default em vez de module.exports
export default withPWA(pwaConfig)(nextConfig); 