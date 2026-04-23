import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      // Profile avatars are uploaded to Cloudinary.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  experimental: {
    // Tree-shake large barrel-imported packages used across the app.
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      'cmdk',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
    ],
  },

  async headers() {
    return [
      {
        // Next.js build output — content-hashed, safe to cache forever.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
