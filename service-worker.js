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
// Bump CACHE_NAME (via setCacheNameDetails suffix) whenever the precache
// list meaningfully changes so old caches get purged on next activation.

importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js");

const { precaching, routing, strategies, core } = workbox;

core.setCacheNameDetails({ prefix: "verrocchio", suffix: "v64" });
self.skipWaiting();
core.clientsClaim();

// App shell — precached on install. Revision strings are tied to the
// suffix above; bumping the suffix forces re-fetch on activation.
precaching.precacheAndRoute([
  { url: "./index.html",                revision: "v64" },
  { url: "./utils.js",                  revision: "v64" },
  { url: "./lib/hydration.js",          revision: "v64" },
  { url: "./manifest.json",             revision: "v64" },
  { url: "./apple-touch-icon-1024.png", revision: "v64" }
]);

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
    cacheName: "verrocchio-navigations-v64",
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
  new strategies.CacheFirst({ cacheName: "verrocchio-static-v64" })
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
  new strategies.StaleWhileRevalidate({ cacheName: "verrocchio-cdn-v64" })
);
