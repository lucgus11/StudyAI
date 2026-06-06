/**
 * StudyAI — Service Worker
 * Cache stratégique pour accès hors-ligne complet.
 */

const STATIC_CACHE = "studyai-static-v1";
const PAGES_CACHE  = "studyai-pages-v1";
const API_CACHE    = "studyai-api-v1";
const ALL_CACHES   = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/dashboard/courses",
  "/dashboard/planner",
  "/dashboard/sheets",
  "/dashboard/offline",
  "/offline",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES_CACHE).then(async (cache) => {
      for (const url of PRECACHE_URLS) {
        try { await cache.add(url); }
        catch { console.warn("[SW] Skip:", url); }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !ALL_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  if (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/api/") ||
    (url.hostname.includes("supabase.co") && url.pathname.includes("/auth/"))
  ) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (
    /\.(png|jpg|jpeg|svg|gif|ico|webp|woff|woff2|ttf)$/i.test(url.pathname) ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (url.hostname.includes("supabase.co") && url.pathname.includes("/storage/")) {
    event.respondWith(cacheFirst(request, API_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, PAGES_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("Non disponible hors-ligne.", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offlinePage = await cache.match("/offline");
    if (offlinePage) return offlinePage;
    return new Response(
      `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hors-ligne</title>
<style>body{background:#020617;color:#f1f5f9;font-family:sans-serif;display:flex;
flex-direction:column;align-items:center;justify-content:center;min-height:100vh;
text-align:center;padding:24px}h1{font-size:1.5rem;font-weight:700;margin:16px 0 8px}
p{color:#64748b;max-width:320px;line-height:1.6;margin-bottom:24px}
a{background:#4f46e5;color:#fff;padding:10px 24px;border-radius:10px;
text-decoration:none;font-weight:600}</style></head>
<body><div style="font-size:3rem">📶</div><h1>Pas de connexion</h1>
<p>Visite tes cours téléchargés.</p>
<a href="/dashboard/offline">Cours hors-ligne</a></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CACHE_URLS") {
    caches.open(PAGES_CACHE).then((cache) => {
      (event.data.urls || []).forEach((url) => {
        fetch(url).then((res) => { if (res.ok) cache.put(url, res); }).catch(() => {});
      });
    });
  }
});
