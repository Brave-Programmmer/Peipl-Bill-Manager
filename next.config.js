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

  // Webpack & Bundle Optimization
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // React vendor chunk
          react: {
            name: "chunk-react",
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // UI Library chunks
          ui: {
            name: "chunk-ui",
            test: /[\\/]node_modules[\\/](react-hot-toast|react-icons|react-window)[\\/]/,
            priority: 30,
            reuseExistingChunk: true,
            enforce: true,
          },
          // DnD Kit chunks
          dnd: {
            name: "chunk-dnd",
            test: /[\\/]node_modules[\\/](@dnd-kit)[\\/]/,
            priority: 25,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Utilities chunks
          utils: {
            name: "chunk-utils",
            test: /[\\/]node_modules[\\/](jspdf|html2canvas|mathjs)[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Shared component chunks
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            name: "chunk-common",
          },
        },
      },
    };

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

module.exports = nextConfig;
