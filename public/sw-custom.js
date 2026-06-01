/**
 * StudyAI – Service Worker Custom
 * Gère la page de fallback offline et le préchargement des routes.
 * Ce fichier complète le SW généré par next-pwa.
 */

const OFFLINE_FALLBACK = '/offline';
const PRECACHE_ROUTES = [
  '/dashboard',
  '/dashboard/courses',
  '/dashboard/planner',
  '/dashboard/sheets',
  '/dashboard/offline',
];

// Précharger les routes dashboard à l'installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('studyai-pages').then((cache) => {
      return cache.addAll(PRECACHE_ROUTES).catch(() => {
        // Silencieux si offline à l'installation
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
