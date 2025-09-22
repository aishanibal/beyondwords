import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force rebuild for layout fixes v2.1
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
    const backendUrl = process.env.BACKEND_URL || 'https://beyondwords-express.onrender.com';
    
    return [
      {
        source: '/api/feedback',
        destination: `${backendUrl}/api/feedback`, // Express backend
      },
      {
        source: '/api/translate',
        destination: `${backendUrl}/api/translate`, // Express backend
      },
      {
        source: '/api/user/:path*',
        destination: `${backendUrl}/api/user/:path*`, // Express backend
      },
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`, // Express backend
      },
      {
        source: '/api/messages/:path*',
        destination: `${backendUrl}/api/messages/:path*`, // Express backend
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/api/health`, // Express backend
      },
      {
        source: '/api/messages/feedback',
        destination: `${backendUrl}/api/messages/feedback`, // Express backend
      },
      {
        source: '/api/contact',
        destination: `${backendUrl}/api/contact`, // Express backend
      }
    ];
  },
};

export default nextConfig;
