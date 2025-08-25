/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.swell.store' },
      { protocol: 'https', hostname: 'images.swell.store' },
      { protocol: 'https', hostname: 'images.pexels.com' }
    ]
  },
};
export default nextConfig;
