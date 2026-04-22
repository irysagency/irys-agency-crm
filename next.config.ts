import type { NextConfig } from 'next'

// 2026-04-22
const nextConfig: NextConfig = {
  serverExternalPackages: ['googleapis'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
