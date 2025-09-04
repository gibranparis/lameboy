/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.swell.store' },
      { protocol: 'https', hostname: 'images.swell.store' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

export default nextConfig;
