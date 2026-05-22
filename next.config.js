/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Ne jamais cacher les routes d'auth et d'API — laisse le réseau gérer
  publicExcludes: ["!icons/**/*"],
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // Routes auth et API → toujours réseau, jamais cache
    {
      urlPattern: /^https?:\/\/.*\/(auth|api)\/.*/i,
      handler: "NetworkOnly",
    },
    // Dashboard → réseau en priorité, cache en fallback
    {
      urlPattern: /^https?:\/\/.*\/dashboard.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "dashboard-cache",
        networkTimeoutSeconds: 10,
      },
    },
    // PDFs Supabase Storage
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "supabase-storage",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    // Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-webfonts",
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // Images statiques
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "static-image-assets" },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["supabase.co"],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
