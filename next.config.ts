import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // For Docker deployment - standalone output
  output: "standalone",

  // Temporarily disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Temporarily disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Handle server-only packages
  webpack: (config, { isServer }) => {
    // Handle server-only packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        sqlite3: false,
        "better-sqlite3": false,
        ws: false,
      };
    }

    return config;
  },

  // Avoid CORS issues with Binance WebSocket
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
