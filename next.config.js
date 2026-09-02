const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@firebase/auth': path.resolve(__dirname, 'node_modules/@firebase/auth'),
    };
    return config;
  },
};

module.exports = nextConfig;
