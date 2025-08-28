/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // if using static export
  assetPrefix: "./", // makes assets load relative to index.html
  trailingSlash: false,
  basePath: "", // avoid wrong routing in file://
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
