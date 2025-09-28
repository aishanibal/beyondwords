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
        source: '/api/auth/exchange',
        destination: `${backendUrl}/auth/exchange`, // Express backend (note: no /api prefix)
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
        source: '/api/contact',
        destination: `${backendUrl}/api/contact`, // Express backend
      },
      {
        source: '/api/tts',
        destination: `${backendUrl}/api/tts`, // Express backend
      },
      {
        source: '/api/tts-test',
        destination: `${backendUrl}/api/tts-test`, // Express backend fallback
      },
      {
        source: '/api/quick_translation',
        destination: `${backendUrl}/api/quick_translation`, // Express backend
      },
      {
        source: '/api/explain_suggestion',
        destination: `${backendUrl}/api/explain_suggestion`, // Express backend
      },
      {
        source: '/api/detailed_breakdown',
        destination: `${backendUrl}/api/detailed_breakdown`, // Express backend
      },
      {
        source: '/api/conversation-summary',
        destination: `${backendUrl}/api/conversation-summary`, // Express backend
      }
    ];
  },
};

export default nextConfig;
