// Verrocchio service worker. Makes the app openable (and fully usable,
// minus the AI briefing/insights) without a network connection after
// the first successful load.
//
// Strategy:
//   • App shell (index.html, utils.js, icons, manifest) is precached on
//     install so the first visit after install opens instantly even if
//     the network is down.
//   • CDN scripts (React, Firebase, Chart.js, Google Fonts) are cached
//     on first fetch (stale-while-revalidate): served from cache if
//     present, with a background refresh.
//   • Anything hitting Firestore / Firebase auth / the AI proxy is
//     never cached — those are data endpoints that need real network.
//     Firebase's own SDK handles offline queueing via IndexedDB.
//
// Bump CACHE_NAME whenever the precache list meaningfully changes so
// old caches get purged on next activation.

const CACHE_NAME = "verrocchio-shell-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./utils.js",
  "./manifest.json",
  "./splash-animation.html",
  "./apple-touch-icon.png",
  "./apple-touch-icon-1024.png"
];

// Hosts whose GETs we're happy to cache on first fetch. Everything NOT
// on this list falls through to the default fetch path, so Firebase
// APIs and the AI proxy never hit the cache.
const RUNTIME_CACHEABLE_HOSTS = new Set([
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "www.gstatic.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com"
]);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return; // POSTs (Firestore writes, AI) pass through

  const url = new URL(req.url);

  // Same-origin: serve from cache first (SPA shell), fall through to
  // network on miss, and opportunistically populate the cache.
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Cross-origin: only runtime-cache known static-asset hosts. Firebase
  // data endpoints and the AI proxy fall through to the default fetch.
  if (RUNTIME_CACHEABLE_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone()).catch(() => {});
    return resp;
  } catch (err) {
    // Offline and no cache entry — return a minimal fallback so the
    // browser doesn't show its own "no internet" page.
    if (req.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const fetching = fetch(req).then(resp => {
    if (resp && resp.ok) cache.put(req, resp.clone()).catch(() => {});
    return resp;
  }).catch(() => null);
  return cached || (await fetching) || new Response("", { status: 504 });
}
