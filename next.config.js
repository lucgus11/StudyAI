/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Réactivé avec une config soigneuse pour éviter les problèmes de cache
  disable: process.env.NODE_ENV === "development",
  publicExcludes: ["!icons/**/*"],
  buildExcludes: [/middleware-manifest\.json$/],
  fallbackRoutes: { document: "/offline" },
  runtimeCaching: [
    // ---- AUTH & API : jamais de cache ----
    {
      urlPattern: /^https?:\/\/.*\/(auth|api)\/.*/i,
      handler: "NetworkOnly",
    },
    // ---- Supabase Auth API : jamais de cache ----
    {
      urlPattern: /^https?:\/\/.*\.supabase\.co\/auth\/.*/i,
      handler: "NetworkOnly",
    },
    // ---- Pages dashboard : NetworkFirst (réseau prioritaire, cache fallback) ----
    // Timeout 8s puis sert le cache — accès offline si réseau absent
    {
      urlPattern: /^https?:\/\/[^/]*\/dashboard(\/.*)?$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "studyai-pages",
        networkTimeoutSeconds: 8,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // ---- Pages auth : NetworkOnly (ne jamais servir en cache) ----
    {
      urlPattern: /^https?:\/\/[^/]*\/(auth)(\/.*)?$/i,
      handler: "NetworkOnly",
    },
    // ---- PDFs Supabase Storage : CacheFirst ----
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "studyai-pdfs",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // ---- Fonts Google : CacheFirst (immuables) ----
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "studyai-fonts",
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // ---- JS / CSS Next.js (_next/static) : CacheFirst (versionnés) ----
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
    // ---- Images/_next/image : StaleWhileRevalidate ----
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
    // ---- Icônes et assets statiques ----
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
