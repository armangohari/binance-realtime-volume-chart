import type { NextConfig } from "next";

/**
 * Next.js configuration file
 *
 * This configuration is optimized for:
 * - Next.js 15 with App Router
 * - TypeScript support
 * - Modern development practices
 * - Production deployment readiness
 */
const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable standalone output for containerized deployments
  output: "standalone",

  // Configure image optimization
  images: {
    domains: [], // Add domains for external images if needed
    remotePatterns: [], // Add remote patterns for external images if needed
  },

  // Configure TypeScript and ESLint
  typescript: {
    // Enable type checking during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable linting during build
    ignoreDuringBuilds: false,
  },

  // Webpack configuration for client-side builds
  webpack: (config, { isServer }) => {
    // Handle Node.js built-in modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Configure headers for security and CORS
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
