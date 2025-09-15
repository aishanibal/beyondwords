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
  // Removed rewrites - now using App Router API routes instead
  // async rewrites() {
  //   // All API routes are now handled by App Router API routes in app/api/
  // },
};

export default nextConfig;
