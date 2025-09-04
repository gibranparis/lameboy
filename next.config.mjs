// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  images: {
    // Prefer modern formats; browsers without support fall back to JPEG/PNG automatically.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.swell.store' },
      { protocol: 'https', hostname: 'images.swell.store' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
    // Optional: tune generated sizes for responsive <Image/> usage
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536],
    imageSizes: [300, 450, 600, 800, 1000],
  },
};

export default nextConfig;
