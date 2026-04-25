/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // if using static export
  assetPrefix: "./", // makes assets load relative to index.html
  trailingSlash: false,
  basePath: "", // avoid wrong routing in file://

  // Image Optimization
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack & Bundle Optimization
  webpack: (config, { isServer }) => {
    // Basic webpack config, avoiding overriding splitChunks which can break Next.js internal routing
    return config;
  },

  // Compiler Options
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
    emotion: false,
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  // React strict mode for better error detection in development
  reactStrictMode: true,

  // Preload critical routes
  experimental: {
    optimizePackageImports: [
      "react-hot-toast",
      "react-icons",
      "react-icons/fi",
      "@dnd-kit/core",
    ],
  },
};

export default nextConfig;
