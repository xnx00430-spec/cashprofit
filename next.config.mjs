/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack (Next.js 15+)
  turbopack: {},
  
  // Optimisations
  compress: true,
  
  // Précharge les images
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/webp'],
  },
}

export default nextConfig