// Verrocchio service worker — Workbox-powered. Replaces 152 hand-rolled
// lines of cache plumbing with declarative routes. Same contract as
// before:
//   • Precache the app shell on install (index.html, utils.js,
//     hydration, manifest, icon)
//   • Same-origin navigations → network-first (so a fresh deploy reaches
//     online users immediately; offline users fall back to precache)
//   • Same-origin assets → cache-first (precached / first-seen)
//   • Cross-origin CDN hosts → stale-while-revalidate
//   • Apex "/" → bypassed entirely. Firebase Hosting 302s "/" → "/home";
//     the SW must NOT intercept so the browser sees the redirect.
//   • Everything else (Firebase data, AI proxy) → no SW route, default
//     network behaviour applies.
//
// Bumping SHELL_VERSION below is the SINGLE point of truth for cache
// versioning. It feeds setCacheNameDetails (Workbox auto-named caches),
// every precache revision, every runtime-cache name, AND the legacy-
// purge predicate in the activate handler. Bumping it on the next
// deploy is sufficient to invalidate every cache this SW owns.

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js");

const { precaching, routing, strategies, core } = workbox;

const SHELL_VERSION = "v65";

core.setCacheNameDetails({ prefix: "verrocchio", suffix: SHELL_VERSION });
self.skipWaiting();
core.clientsClaim();

// App shell — precached on install. Revision strings share SHELL_VERSION
// so a single bump forces re-fetch.
precaching.precacheAndRoute([
  { url: "./index.html",                revision: SHELL_VERSION },
  { url: "./utils.js",                  revision: SHELL_VERSION },
  { url: "./lib/hydration.js",          revision: SHELL_VERSION },
  { url: "./lib/dialog.js",             revision: SHELL_VERSION },
  { url: "./manifest.json",             revision: SHELL_VERSION },
  { url: "./apple-touch-icon-1024.png", revision: SHELL_VERSION }
]);

// Workbox's own outdated-precache sweep + a one-time migration that
// deletes legacy `verrocchio-shell-vNN` caches created by the pre-v64
// hand-rolled SW. cleanupOutdatedCaches() only sweeps Workbox-managed
// precaches, so we also iterate caches.keys() and delete anything under
// our prefix whose name does NOT end with the current SHELL_VERSION.
precaching.cleanupOutdatedCaches();
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (!k.startsWith("verrocchio-")) return null;
        if (k.endsWith(SHELL_VERSION)) return null;
        return caches.delete(k);
      }))
    )
  );
});

// Same-origin navigations → network-first. Excludes apex "/" so the
// Firebase Hosting 302 to /home reaches the browser uninterrupted —
// caching "/" once trapped users on the SPA shell even after the
// marketing landing shipped, so we leave it alone.
routing.registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    url.pathname !== "/" &&
    (request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html")),
  new strategies.NetworkFirst({
    cacheName: `verrocchio-navigations-${SHELL_VERSION}`,
    networkTimeoutSeconds: 4
  })
);

// Same-origin non-navigation GETs → cache-first. precacheAndRoute above
// already wired the precached files into a higher-priority route, so
// this is the fallback for first-seen same-origin assets.
routing.registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname !== "/" &&
    request.method === "GET",
  new strategies.CacheFirst({ cacheName: `verrocchio-static-${SHELL_VERSION}` })
);

// Cross-origin static CDN hosts → stale-while-revalidate. Firebase auth
// / Firestore / AI-proxy hosts are NOT on this list and fall through to
// the browser's default fetch path (no SW caching).
const RUNTIME_CACHEABLE_HOSTS = [
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "www.gstatic.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdn.jsdelivr.net"
];
routing.registerRoute(
  ({ url, request }) =>
    RUNTIME_CACHEABLE_HOSTS.includes(url.hostname) &&
    request.method === "GET",
  new strategies.StaleWhileRevalidate({ cacheName: `verrocchio-cdn-${SHELL_VERSION}` })
);
