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
      // Only keep rewrite rules for routes that DON'T have corresponding API files
      {
        source: '/api/health',
        destination: `${backendUrl}/api/health`, // Express backend
      }
      // All other routes are handled by individual API files in /pages/api/
    ];
  },
};

export default nextConfig;
