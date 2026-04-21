import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
