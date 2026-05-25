// lib/sw-register.js
//
// Service worker registration + localhost dev-loop bypass.
// Originally inline at index.html L1266-L1335 (70 LOC).
//
// Runs at script-load time (side effects only — no exports). The
// localhost dev branch proactively unregisters any prior SW + purges
// verrocchio-* caches so a stale Workbox shell from a prior dev
// session does not block reload-driven iteration. Playwright sets
// navigator.webdriver === true so the dev bypass skips them, and they
// exercise the real SW (offline.spec.js + sw-migration.spec.js).
//
// IMPORTANT: this file is NOT itself precached by the SW (would be
// circular). It must be loaded by a <script src> in <head> so the
// browser fetches it on every navigation, not from the SW cache.

(function () {
  "use strict";
// Register the service worker for offline app-shell caching. Guarded on
// HTTPS / localhost because browsers only allow SW registration in
// secure contexts — no-op on file:// or plain-http test servers.
//   updateViaCache:"none" makes the browser bypass its HTTP cache when
//   checking for an updated service-worker.js. GitHub Pages serves the
//   file with Cache-Control: max-age=600, which would otherwise delay
//   SW updates by up to 10 minutes after a deploy. With "none" the
//   check is fresh on every navigation.
// Localhost dev-loop bypass. Past sessions repeatedly hit "I see nothing
// that improved" / "file looks stale" because a Workbox SW from a prior
// dev session was still serving the precached old shell on reload. Fix:
// on plain localhost (NOT webdriver-controlled — i.e. NOT Playwright),
// skip SW registration entirely and proactively unregister any prior SW
// + purge its caches. Playwright tests set navigator.webdriver === true,
// so they bypass this branch and exercise the real SW like a prod user
// (offline.spec.js, sw-migration.spec.js depend on that). Production
// (https) never matches because hostname !== localhost.
const __vSwIsLocalDevSkip =
  (location.hostname === "localhost"
    || location.hostname === "127.0.0.1"
    || location.hostname === "0.0.0.0")
  && navigator.webdriver !== true;

if (__vSwIsLocalDevSkip && "serviceWorker" in navigator) {
  try { console.log("[verrocchio:sw] localhost dev (no webdriver) — skipping SW + purging stale caches"); } catch (_) {}
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => { try { r.unregister(); } catch (e) {} });
  }).catch(() => {});
  try {
    caches.keys().then(keys => {
      keys.forEach(k => { if (k.startsWith("verrocchio-")) caches.delete(k).catch(() => {}); });
    }).catch(() => {});
  } catch (e) {}
} else if ("serviceWorker" in navigator
    && location.protocol !== "capacitor:"
    && location.protocol !== "file:"
    && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" }).then(reg => {
    // Force an update check on every page load. register() alone won't
    // re-fetch service-worker.js; the browser self-schedules update
    // checks (typically every 24h, throttled), which means installed
    // PWAs can serve stale shells for a long time after a deploy.
    if (reg && reg.update) reg.update().catch(() => {});
    // Re-poll every 60s while the tab/PWA stays open so a deploy that
    // lands mid-session is picked up within a minute.
    if (reg && reg.update) {
      setInterval(() => { try { reg.update(); } catch (e) {} }, 60000);
    }
    // When a NEW service worker takes over (skipWaiting + clients.claim
    // in the SW push it through), reload ONCE so the fresh HTML/JS is
    // actually used. Without this, the page keeps running the old
    // bundle until the user navigates manually.
    let _swReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (_swReloaded) return;
      _swReloaded = true;
      // Surface a brief toast so the user understands why the page is
      // about to reload — otherwise it looks like an unexpected flash.
      // Wrapped in try/catch because document.body may not be ready in
      // edge cases (very fast SW handoff during initial load).
      try {
        const div = document.createElement("div");
        div.textContent = "New version available — reloading…";
        div.style.cssText = "position:fixed;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);left:50%;transform:translateX(-50%);background:#2d5a2d;color:#fff;padding:10px 16px;border-radius:8px;z-index:99999;font-family:system-ui,-apple-system,sans-serif;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:90vw";
        document.body.appendChild(div);
      } catch (e) {}
      setTimeout(() => { try { location.reload(); } catch (e) {} }, 1200);
    });
  }).catch(() => {});
}
})();
