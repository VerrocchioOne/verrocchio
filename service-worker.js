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

const CACHE_NAME = "verrocchio-shell-v45";

// Apex "/" deliberately omitted — it 302-redirects to /home (Firebase
// Hosting). Precaching "/" stored stale SPA-shell content from before
// the marketing routing existed, which trapped returning users on the
// app instead of the landing page. The fetch handler below explicitly
// bypasses navigation requests for "/" so the browser sees the
// server's 302 directly with no SW interception.
const APP_SHELL = [
  "./index.html",
  "./utils.js",
  "./manifest.json",
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
  // Per-file add rather than addAll: addAll rejects the entire
  // install (leaving the app uncached) if a single URL 404s, and
  // we'd rather ship with whatever precached successfully than fail
  // closed. Warnings are best-effort; the SW console will show them
  // without aborting activation.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(APP_SHELL.map(url =>
        cache.add(url).catch(err => {
          try { console.warn("[sw] precache miss:", url, err && err.message); } catch (e) {}
        })
      ))
    )
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

  // Same-origin strategy split:
  //   • Navigation / HTML requests → network-first. Cache-first on the
  //     SPA shell trapped users on whichever index.html happened to be
  //     cached — fresh deploys never reached anyone with the worker
  //     installed. Network-first means online users always see the
  //     latest HTML; offline users still fall back to the cached shell.
  //   • Everything else (utils.js, manifest, icons, splash) → cache-first.
  //     These are precached and rarely change; serving them from cache
  //     keeps cold-start fast.
  if (url.origin === self.location.origin) {
    // Apex bypass: never intercept "/". Firebase Hosting 302-redirects
    // "/" → "/home" and we want the browser to see that redirect
    // directly. Old SW versions cached "/" → SPA-shell content, which
    // trapped returning users on the app even after the marketing
    // routing shipped; leaving "/" alone fixes that for any client
    // that activates this SW.
    if (url.pathname === "/") return;
    const isNav = req.mode === "navigate"
      || (req.headers.get("accept") || "").includes("text/html");
    event.respondWith(isNav ? networkFirst(req) : cacheFirst(req));
    return;
  }

  // Cross-origin: only runtime-cache known static-asset hosts. Firebase
  // data endpoints and the AI proxy fall through to the default fetch.
  if (RUNTIME_CACHEABLE_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone()).catch(() => {});
    return resp;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }
    throw err;
  }
}

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
