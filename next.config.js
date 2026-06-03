/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  publicExcludes: ["!icons/**/*"],
  buildExcludes: [/middleware-manifest\.json$/],
  fallbacks: { document: "/offline" },
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/(auth|api)\/.*/i,
      handler: "NetworkOnly",
    },
    {
      urlPattern: /^https?:\/\/.*\.supabase\.co\/auth\/.*/i,
      handler: "NetworkOnly",
    },
    {
      urlPattern: /^https?:\/\/[^/]*\/dashboard(\/.*)?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "studyai-pages",
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https?:\/\/[^/]*\/auth(\/.*)?$/i,
      handler: "NetworkOnly",
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "studyai-pdfs",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "studyai-fonts",
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "studyai-next-static",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365,
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "studyai-images",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "studyai-static-assets" },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["supabase.co"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
