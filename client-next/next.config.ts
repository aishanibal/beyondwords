import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    return [
      {
        source: '/api/analyze',
        destination: `${apiUrl}/api/analyze`,
      },
      {
        source: '/api/conversations/:id/messages',
        destination: `${apiUrl}/api/conversations/:id/messages`,
      },
      {
        source: '/api/suggestions',
        destination: `${apiUrl}/api/suggestions`,
      },
      {
        source: '/api/short_feedback',
        destination: `${apiUrl}/api/short_feedback`,
      },
      {
        source: '/api/feedback',
        destination: `${apiUrl}/api/feedback`,
      },
      {
        source: '/api/detailed_breakdown',
        destination: `${apiUrl}/api/detailed_breakdown`,
      },
      {
        source: '/api/translate',
        destination: `${apiUrl}/api/translate`,
      },
      {
        source: '/api/quick_translation',
        destination: `${apiUrl}/api/quick_translation`,
      },
      {
        source: '/api/user/:path*',
        destination: `${apiUrl}/api/user/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${apiUrl}/auth/:path*`,
      },
      {
        source: '/api/conversations/:path*',            
        destination: `${apiUrl}/api/conversations/:path*`,
      },
      {
        source: '/api/messages/:path*',
        destination: `${apiUrl}/api/messages/:path*`,
      },
      {
        source: '/api/health',
        destination: `${apiUrl}/api/health`,
      },
      {
        source: '/api/conversations',
        destination: `${apiUrl}/api/conversations`,
      },
      {
        source: '/api/conversations/:id',
        destination: `${apiUrl}/api/conversations/:id`,
      },
      {
        source: '/api/messages/feedback',
        destination: `${apiUrl}/api/messages/feedback`,
      }
    ];
  },
};

export default nextConfig;
